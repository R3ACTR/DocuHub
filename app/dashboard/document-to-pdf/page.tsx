"use client";

import { useState } from "react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import * as mammoth from "mammoth";

export default function DocumentToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Remove selected file
  const handleRemoveFile = () => {
    setFiles([]);
  };

  const handleConvert = async () => {
    if (!files.length) {
      alert("Select a file");
      return;
    }

    setLoading(true);

    try {
      const file = files[0];
      let text = "";

      console.log("Processing:", file.name);

      // ✅ DOCX Support
      if (file.name.toLowerCase().endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();

        const result = await mammoth.extractRawText({
          arrayBuffer,
        });

        text = result.value || "";
      } else {
        text = await file.text();
      }

      // ✅ Validate text extracted
      if (!text || text.trim().length === 0) {
        throw new Error("No readable text found in file");
      }

      // ✅ Create PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const fontSize = 12;
      const margin = 50;
      const { width, height } = page.getSize();

      // ✅ Word Wrap
      const words = text.split(/\s+/);
      let lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine + word + " ";
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (textWidth > width - margin * 2 && currentLine !== "") {
          lines.push(currentLine);
          currentLine = word + " ";
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) lines.push(currentLine);

      // ✅ Draw text
      let y = height - margin;

      for (const line of lines) {
        if (y < margin) break;

        page.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font,
          maxWidth: width - margin * 2,
        });

        y -= fontSize + 6;
      }

      const pdfBytes = await pdfDoc.save();

      // ✅ Download
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CONVERSION ERROR:", err);
      alert("Failed to convert document. Check console (F12).");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h1>Document to PDF</h1>

      {/* ✅ Upload Input */}
      <input
        type="file"
        accept=".txt,.html,.json,.docx"
        onChange={(e) => {
          if (!e.target.files) return;
          setFiles(Array.from(e.target.files));
        }}
      />

      {/* ✅ File Preview Section */}
      {files.length > 0 && (
        <div
          style={{
            marginTop: 20,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f9f9f9",
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
              cursor: "pointer",
            }}
          >
            Remove ❌
          </button>
        </div>
      )}

      <br />

      {/* ✅ Convert Button */}
      <button onClick={handleConvert} disabled={loading}>
        {loading ? "Converting..." : "Convert to PDF"}
      </button>
    </div>
  );
}
