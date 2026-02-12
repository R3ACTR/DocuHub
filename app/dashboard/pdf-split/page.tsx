'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function PdfSplitPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pageRange, setPageRange] = useState("");

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

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );

    if (droppedFiles.length === 0) return;

    setFiles(droppedFiles.slice(0, 1));
  };

  const handleSplit = async () => {
    if (files.length < 1) {
      alert("Please select a PDF file");
      return;
    }

    if (!pageRange) {
      alert("Please enter page range");
      return;
    }

    setLoading(true);

    try {
      const file = files[0];
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      const newPdf = await PDFDocument.create();
      const pagesToExtract: number[] = [];

      if (pageRange.includes("-")) {
        const [start, end] = pageRange.split("-").map(Number);

        if (isNaN(start) || isNaN(end) || start < 1 || end > pdf.getPageCount()) {
          alert("Invalid page range");
          setLoading(false);
          return;
        }

        for (let i = start; i <= end; i++) {
          pagesToExtract.push(i - 1);
        }
      } else {
        const page = Number(pageRange);

        if (isNaN(page) || page < 1 || page > pdf.getPageCount()) {
          alert("Invalid page number");
          setLoading(false);
          return;
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
          onChange={(e) => {
            if (!e.target.files) return;
            setFiles([e.target.files[0]]);
          }}
          className="mx-auto block"
        />

        <p className="text-sm text-gray-500 mt-2">
          {files.length} file selected
        </p>
      </div>

      {/* File Preview Card */}
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
        onClick={handleSplit}
        disabled={loading || files.length < 1}
        className={`w-full mt-6 py-3 rounded-lg font-medium transition ${
          loading || files.length < 1
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 text-white"
        }`}
      >
        {loading ? "Splitting PDF..." : "Split PDF"}
      </button>

    </div>
  );
}
