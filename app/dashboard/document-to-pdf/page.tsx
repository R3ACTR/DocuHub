"use client";

import { useRef, useState } from "react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import * as mammoth from "mammoth";

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [".txt", ".html", ".json", ".docx"];

  const isValidFileType = (fileName?: string) => {
    if (!fileName) return false;
    return ALLOWED_TYPES.some((ext) => fileName.toLowerCase().endsWith(ext));
  };

  const processSelectedFiles = (incomingFiles: File[]) => {
    if (!incomingFiles.length) return;

    const validFiles: File[] = [];
    const invalidFileNames: string[] = [];

    for (const file of incomingFiles) {
      if (isValidFileType(file.name)) {
        validFiles.push(file);
      } else {
        invalidFileNames.push(file.name);
      }
    }

    if (!validFiles.length) {
      setError("Unsupported file type. Please upload: .txt, .html, .json, .docx");
      return;
    }

    setFiles((prev) => {
      const merged = [...prev, ...validFiles];
      return merged.filter(
        (file, index, arr) =>
          arr.findIndex(
            (f) =>
              f.name === file.name &&
              f.size === file.size &&
              f.lastModified === file.lastModified
          ) === index
      );
    });

    if (invalidFileNames.length) {
      setError(
        `Ignored unsupported files: ${invalidFileNames.join(", ")}. Allowed types: .txt, .html, .json, .docx`
      );
      return;
    }

    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    processSelectedFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (!e.dataTransfer.files?.length) return;
    processSelectedFiles(Array.from(e.dataTransfer.files));
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const clearSelection = () => {
    setFiles([]);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const convertFileToPdf = async (file: File): Promise<Uint8Array> => {
    let text = "";

    if (file.name.toLowerCase().endsWith(".docx")) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value || "";
    } else {
      text = await file.text();
    }

    if (!text || text.trim().length === 0) {
      throw new Error(`No readable text found in ${file.name}`);
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const fontSize = 12;
    const margin = 50;
    const { width, height } = page.getSize();

    const words = text.split(/\s+/);
    const lines: string[] = [];
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

    return new Uint8Array(await pdfDoc.save());
  };

  const downloadPdf = (pdfBytes: Uint8Array, sourceFileName: string) => {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = sourceFileName.replace(/\.[^/.]+$/, "") + ".pdf";
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleConvert = async () => {
    if (!files.length) return;

    setLoading(true);
    setError("");

    try {
      const conversionResults = await Promise.all(
        files.map(async (file) => ({
          file,
          pdfBytes: await convertFileToPdf(file),
        }))
      );

      for (const { file, pdfBytes } of conversionResults) {
        downloadPdf(pdfBytes, file.name);
        saveRecentFile(file.name, "Document to PDF");
      }
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
        multiple
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
          {isDragging ? "Drop files here" : "Drop files here or click to upload"}
        </p>
      </div>

      {error && (
        <p style={{ color: "red", marginTop: 10 }}>
          {error}
        </p>
      )}

      {files.length > 0 && (
        <>
          <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}`}
                style={{
                  padding: 12,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  background: "#fafafa",
                  gap: 12,
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>

                <button
                  onClick={() => handleRemoveFile(index)}
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
            ))}
          </div>

          <button
            onClick={clearSelection}
            style={{
              marginTop: 12,
              background: "transparent",
              color: "#374151",
              border: "1px solid #d1d5db",
              padding: "6px 12px",
              borderRadius: 6,
            }}
          >
            Clear all
          </button>
        </>
      )}

      <br />

      <button
        onClick={handleConvert}
        disabled={loading || files.length === 0}
        style={{
          padding: "12px 24px",
          background: "#6c63ff",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: loading || files.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Converting..." : `Convert ${files.length} file(s) to PDF`}
      </button>
    </div>
  );
}
