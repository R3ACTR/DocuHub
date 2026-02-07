'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function PdfMergePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};


const removeFile = (indexToRemove: number) => {
  setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
};
  
const moveFile = (from: number, to: number) => {
  const updated = [...files];
  const [moved] = updated.splice(from, 1);
  updated.splice(to, 0, moved);
  setFiles(updated);
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
    (file) => file.type === 'application/pdf'
  );

  if (droppedFiles.length === 0) return;

  setFiles((prev) => [...prev, ...droppedFiles]);
};

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please select at least 2 PDF files');
      return;
    }

    setLoading(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page: any) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
const blob = new Blob([new Uint8Array(mergedBytes)], {
  type: 'application/pdf',
});



      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to merge PDFs');
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


      <h1 style={{
  fontSize: "24px",
  fontWeight: "600",
  marginBottom: "6px",
}}>
  Merge PDF Files
</h1>

<p style={{
  color: "#6b7280",
  fontSize: "14px",
  marginBottom: "16px",
}}>
  Drag & drop or select multiple PDF files to merge them into one document.
</p>

      <p>Select multiple PDF files to merge them into one.</p>
      <p style={{ color: '#666', marginTop: '0.5rem' }}>
  Drag & drop PDF files here, or use the file picker below.
</p>


      <input
  type="file"
  accept="application/pdf"
  multiple
  style={{
    marginTop: "10px",
    marginBottom: "10px",
  }}
  onChange={(e) => {
    if (!e.target.files) return;
    setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  }}
/>


      <p>{files.length} file(s) selected</p>

      {files.length > 0 && (
  <button
    onClick={() => setFiles([])}
    style={{
      marginBottom: "10px",
      backgroundColor: "#6b7280",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "6px 12px",
      cursor: "pointer",
    }}
  >
    Clear All
  </button>
)}

      {files.map((file, index) => (
  <div
    key={index}
    draggable
    onDragStart={() => setDragIndex(index)}
    onDragOver={(e) => e.preventDefault()}
    onDrop={() => {
      if (dragIndex === null) return;
      moveFile(dragIndex, index);
      setDragIndex(null);
    }}
style={{
  padding: "12px",
  marginTop: "10px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  backgroundColor: "white",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}}

  >
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  <span style={{
    backgroundColor: "#4f46e5",
    color: "white",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px"
  }}>
    {index + 1}
  </span>

  <div>
    <div style={{ fontWeight: "500" }}>📄 {file.name}</div>
    <div style={{ fontSize: "12px", color: "#666" }}>
      {formatFileSize(file.size)}
    </div>
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
  fontSize: "12px",
}}

    >
      Remove
    </button>
  </div>
))}


<div style={{ textAlign: "center" }}>
      <button
  onClick={handleMerge}
  disabled={loading || files.length < 2}
  style={{
    marginTop: "20px",
    backgroundColor: loading || files.length < 2 ? "#9ca3af" : "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    cursor: loading || files.length < 2 ? "not-allowed" : "pointer",
    fontWeight: "500",
    fontSize: "14px",
  }}
>
  {loading ? "Merging PDFs..." : "Merge PDFs"}
</button>
</div>
    </div>
  );
}
