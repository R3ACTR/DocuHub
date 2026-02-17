"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { buildThreatWarning, scanUploadedFiles } from "@/lib/security/virusScan";

export default function PdfSplitPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pageRange, setPageRange] = useState("");
  const [securityWarning, setSecurityWarning] = useState("");
  const [scanState, setScanState] = useState<"idle" | "scanning" | "clean" | "threat">("idle");
  const [scanMessage, setScanMessage] = useState("");

  /* ✅ SUCCESS STATE */
  const [successMsg, setSuccessMsg] = useState("");

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );

    if (!droppedFiles.length) return;
    const { cleanFiles, threats } = await scanUploadedFiles(droppedFiles);
    if (!cleanFiles.length) {
      setSecurityWarning(buildThreatWarning(threats));
      return;
    }
    setSecurityWarning(threats.length ? buildThreatWarning(threats) : "");
    setFiles([cleanFiles[0]]);
    setScanState("idle");
    setScanMessage('Click "Scan Files" before splitting.');
  };

  const runScan = async () => {
    if (!files.length) return;
    setScanState("scanning");
    setScanMessage("Scanning files...");
    setSecurityWarning("");

    const { cleanFiles, threats } = await scanUploadedFiles(files);
    if (!cleanFiles.length) {
      const warning = buildThreatWarning(threats) || "Security scan failed.";
      setFiles([]);
      setSecurityWarning(warning);
      setScanState("threat");
      setScanMessage(warning);
      return;
    }

    setFiles([cleanFiles[0]]);
    if (threats.length) {
      setSecurityWarning(buildThreatWarning(threats));
      setScanMessage(`Scan complete. ${threats.length} unsafe file(s) were blocked.`);
    } else {
      setScanMessage("Scan complete. No threats detected.");
    }
    setScanState("clean");
  };

  const handleSplit = async () => {
    if (!files.length) return alert("Please select a PDF file");
    if (!pageRange) return alert("Please enter page range");

    setLoading(true);

    try {
      const file = files[0];
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      const newPdf = await PDFDocument.create();
      const pagesToExtract: number[] = [];

      if (pageRange.includes("-")) {
        const [start, end] = pageRange.split("-").map(Number);

        if (
          isNaN(start) ||
          isNaN(end) ||
          start < 1 ||
          end > pdf.getPageCount()
        ) {
          setLoading(false);
          return alert("Invalid page range");
        }

        for (let i = start; i <= end; i++) {
          pagesToExtract.push(i - 1);
        }
      } else {
        const page = Number(pageRange);

        if (
          isNaN(page) ||
          page < 1 ||
          page > pdf.getPageCount()
        ) {
          setLoading(false);
          return alert("Invalid page number");
        }

        pagesToExtract.push(page - 1);
      }

      const copiedPages = await newPdf.copyPages(pdf, pagesToExtract);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const newBytes = await newPdf.save();

      const blob = new Blob([new Uint8Array(newBytes)], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "split.pdf";
      a.click();

      URL.revokeObjectURL(url);

      /* ✅ SUCCESS MESSAGE */
      setSuccessMsg("✅ File downloaded successfully");
      setTimeout(() => setSuccessMsg(""), 3000);

    } catch (err) {
      console.error(err);
      alert("Failed to split PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 px-6">

      {/* Upload Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition ${
          isDragging
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }`}
      >
        <h1 className="text-2xl font-semibold mb-2">Split PDF File</h1>
        <p className="text-gray-500 text-sm mb-4">
          Upload a PDF and choose pages to split
        </p>

        <input
          type="file"
          accept="application/pdf"
          required
          onChange={async (e) => {
            if (!e.target.files) return;
            const { cleanFiles, threats } = await scanUploadedFiles(Array.from(e.target.files));
            if (!cleanFiles.length) {
              setSecurityWarning(buildThreatWarning(threats));
              e.target.value = "";
              return;
            }
            setSecurityWarning(threats.length ? buildThreatWarning(threats) : "");
            setFiles([cleanFiles[0]]);
            setScanState("idle");
            setScanMessage('Click "Scan Files" before splitting.');
            e.target.value = "";
          }}
          className="mx-auto block"
        />
        {securityWarning && (
          <p className="text-red-600 text-sm mt-2">{securityWarning}</p>
        )}
        {scanMessage && (
          <p className={`text-sm mt-2 ${scanState === "clean" ? "text-green-700" : "text-gray-600"}`}>
            {scanMessage}
          </p>
        )}

        {/* ✅ File Count */}
        <p className="text-sm text-gray-500 mt-2">
          {files.length} file selected
        </p>

        {/* ✅ NEW — File Size Near Upload Area */}
        {files.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Size: {formatFileSize(files[0].size)}
          </p>
        )}
      </div>

      {/* Empty State */}
      {files.length === 0 && (
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-lg font-medium">
            No files selected yet
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Upload files to get started
          </p>
        </div>
      )}

      {/* File Info */}
      {files.map((file, index) => (
        <div
          key={index}
          className="mt-4 flex justify-between items-center bg-white border rounded-lg p-4 shadow-sm"
        >
          <div>
            <p className="font-medium">📄 {file.name}</p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </p>
          </div>

          <button
            onClick={() => removeFile(index)}
            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Remove
          </button>
        </div>
      ))}

      {/* Preview */}
      {files.length > 0 && (
        <div className="mt-6 border rounded p-4 h-[500px]">
          <iframe
            src={URL.createObjectURL(files[0])}
            className="w-full h-full rounded"
          />
        </div>
      )}

      {/* Page Input */}
      <input
        type="text"
        placeholder="Enter pages (example: 1-3 or 2)"
        value={pageRange}
        onChange={(e) => setPageRange(e.target.value)}
        className="w-full mt-4 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
      />

      {/* Split Button */}
      <button
        onClick={runScan}
        disabled={loading || !files.length || scanState === "scanning"}
        className={`w-full mt-6 py-3 rounded-lg font-medium transition ${
          loading || !files.length || scanState === "scanning"
            ? "bg-gray-400 cursor-not-allowed text-white"
            : "bg-white border border-black text-black hover:bg-gray-100"
        }`}
      >
        {scanState === "scanning" ? "Scanning..." : "Scan Files"}
      </button>
      <button
        onClick={handleSplit}
        disabled={loading || !files.length || !pageRange || scanState !== "clean"}
        className={`w-full mt-6 py-3 rounded-lg font-medium transition ${
          loading || !files.length || !pageRange || scanState !== "clean"
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 text-white"
        }`}
      >
        {loading ? "Splitting PDF..." : "Split PDF"}
      </button>

      {/* Success Message */}
      {successMsg && (
        <p className="text-green-600 text-sm mt-4 text-center font-medium">
          {successMsg}
        </p>
      )}

    </div>
  );
}
