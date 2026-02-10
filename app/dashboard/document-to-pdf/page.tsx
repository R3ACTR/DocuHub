"use client";

import { useState, useRef } from "react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import * as mammoth from "mammoth";

// ✅ ADDED — Recent Files Save Function
function saveRecentFile(fileName: string, tool: string) {
  const existing = localStorage.getItem("recentFiles");
  let files = existing ? JSON.parse(existing) : [];

  const newEntry = {
    fileName,
    tool,
    time: new Date().toLocaleString(),
  };

  files.unshift(newEntry);
  files = files.slice(0, 5);

  localStorage.setItem("recentFiles", JSON.stringify(files));
}

export default function DocumentToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [".txt", ".html", ".json", ".docx"];

  const isValidFileType = (fileName?: string) => {
    if (!fileName) return false;
    return ALLOWED_TYPES.some((ext) =>
      fileName.toLowerCase().endsWith(ext)
    );
  };

  const processSelectedFile = (file: File) => {
    setFiles([file]);

    if (!isValidFileType(file.name)) {
      setError(
        "Unsupported file type. Please upload: .txt, .html, .json, .docx"
      );
    } else {
      setError("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    processSelectedFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!e.dataTransfer.files?.[0]) return;
    processSelectedFile(e.dataTransfer.files[0]);
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setError("");

    // ✅ BUG FIX — Reset file input so same file type can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleConvert = async () => {
    if (!files[0]) return;

    const file = files[0];

    if (!isValidFileType(file.name)) {
      setError(
        "Unsupported file type. Please upload: .txt, .html, .json, .docx"
      );
      return;
    }

    setLoading(true);

    try {
      let text = "";

      console.log("Processing:", file.name);

      // DOCX Support
      if (file.name.toLowerCase().endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value || "";
      } else {
        text = await file.text();
      }

      if (!text || text.trim().length === 0) {
        throw new Error("No readable text found in file");
      }

      // Create PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const fontSize = 12;
      const margin = 50;
      const { width, height } = page.getSize();

      const words = text.split(/\s+/);
      let lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const test = currentLine + word + " ";
        const w = font.widthOfTextAtSize(test, fontSize);

        if (w > width - margin * 2 && currentLine !== "") {
          lines.push(currentLine);
          currentLine = word + " ";
        } else {
          currentLine = test;
        }
      }

      if (currentLine) lines.push(currentLine);

      let y = height - margin;

      for (const line of lines) {
        if (y < margin) break;

        page.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font,
        });

        y -= fontSize + 6;
      }

      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
      a.click();

      URL.revokeObjectURL(url);

      // ✅ ADDED — Save to Recent Files AFTER SUCCESS
      saveRecentFile(file.name, "Document to PDF");

    } catch (err) {
      console.error(err);
      setError("Conversion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 650, margin: "40px auto" }}>
      <h1>Document to PDF</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.html,.json,.docx"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        style={{
          marginTop: 20,
          padding: 40,
          border: isDragging ? "2px solid #4f46e5" : "2px dashed #6c63ff",
          borderRadius: 12,
          textAlign: "center",
          cursor: "pointer",
          background: isDragging ? "#eef2ff" : "#f6f7ff",
          transition: "all 0.2s ease",
        }}
      >
        <p style={{ fontSize: 18 }}>
          {isDragging ? "📂 Drop file here" : "📂 Drop file here or Click to Upload"}
        </p>
      </div>

      {error && (
        <p style={{ color: "red", marginTop: 10 }}>
          ❌ {error}
        </p>
      )}

      {files[0] && (
        <div
          style={{
            marginTop: 20,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            background: "#fafafa",
          }}
        >
          <span>📄 {files[0].name}</span>

          <button
            onClick={handleRemoveFile}
            style={{
              background: "#ff4d4f",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: 6,
            }}
          >
            Remove
          </button>
        </div>
      )}

      <br />

      <button
        onClick={handleConvert}
        disabled={loading || !!error}
        style={{
          padding: "12px 24px",
          background: "#6c63ff",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: loading || !!error ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Converting..." : "Convert to PDF"}
      </button>
    </div>
  );
}
