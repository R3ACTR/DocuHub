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

    setFiles(droppedFiles.slice(0, 1)); // only one file allowed
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
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "24px",
        border: isDragging ? "2px dashed #4f46e5" : "2px dashed #d1d5db",
        backgroundColor: isDragging ? "#eef2ff" : "#fafafa",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h1
        style={{
          fontSize: "24px",
          fontWeight: "600",
          marginBottom: "6px",
        }}
      >
        Split PDF File
      </h1>

      <p
        style={{
          color: "#6b7280",
          fontSize: "14px",
          marginBottom: "16px",
        }}
      >
        Select a PDF file and specify pages to split.
      </p>

      <input
        type="file"
        accept="application/pdf"
        style={{
          marginTop: "10px",
          marginBottom: "10px",
        }}
        onChange={(e) => {
          if (!e.target.files) return;
          setFiles([e.target.files[0]]);
        }}
      />

      <p>{files.length} file selected</p>

      <input
        type="text"
        placeholder="Enter pages (example: 1-3 or 2)"
        value={pageRange}
        onChange={(e) => setPageRange(e.target.value)}
        style={{
          width: "100%",
          marginTop: "10px",
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
        }}
      />

      {files.map((file, index) => (
        <div
          key={index}
          style={{
            padding: "12px",
            marginTop: "10px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            backgroundColor: "white",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            📄 {file.name}
            <div style={{ fontSize: "12px", color: "#666" }}>
              {formatFileSize(file.size)}
            </div>
          </div>

          <button
            onClick={() => removeFile(index)}
            style={{
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            Remove
          </button>
        </div>
      ))}

      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleSplit}
          disabled={loading || files.length < 1}
          style={{
            marginTop: "20px",
            backgroundColor:
              loading || files.length < 1 ? "#9ca3af" : "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            cursor:
              loading || files.length < 1 ? "not-allowed" : "pointer",
            fontWeight: "500",
          }}
        >
          {loading ? "Splitting PDF..." : "Split PDF"}
        </button>
      </div>
    </div>
  );
}

