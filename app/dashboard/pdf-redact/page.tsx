"use client";

import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb } from "pdf-lib";

// Worker setup
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function PdfRedactPage() {

  const [file, setFile] = useState<File | null>(null);
  const [rectangles, setRectangles] = useState<Rect[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load PDF
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setRectangles([]);

    const arrayBuffer = await selectedFile.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

    await renderPage(pdf, 1);
  };

  // Render PDF page
  const renderPage = async (pdf: any, pageNumber: number) => {

    const page = await pdf.getPage(pageNumber);

    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;
  };

  // Mouse down
  const handleMouseDown = (
    e: React.MouseEvent<HTMLCanvasElement>
  ) => {

    const rect = e.currentTarget.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPoint({ x, y });

    setIsDrawing(true);

    setRectangles(prev => [
      ...prev,
      { x, y, width: 0, height: 0 }
    ]);
  };

  // Mouse move
  const handleMouseMove = (
    e: React.MouseEvent<HTMLCanvasElement>
  ) => {

    if (!isDrawing) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setRectangles(prev => {

      const updated = [...prev];

      const last = updated.length - 1;

      updated[last] = {
        x: Math.min(startPoint.x, currentX),
        y: Math.min(startPoint.y, currentY),
        width: Math.abs(currentX - startPoint.x),
        height: Math.abs(currentY - startPoint.y),
      };

      return updated;
    });
  };

  // Mouse up
  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // FIXED permanent redaction
  const handleRedactPDF = async () => {

  if (!canvasRef.current) return;

  setLoading(true);

  try {

    const canvas = canvasRef.current;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Draw permanent black rectangles onto canvas
    rectangles.forEach(rect => {

      ctx.fillStyle = "black";

      ctx.fillRect(
        rect.x,
        rect.y,
        rect.width,
        rect.height
      );

    });

    // Convert canvas to image
    const imageDataUrl = canvas.toDataURL("image/png");

    // Create new PDF
    const pdfDoc = await PDFDocument.create();

    const page = pdfDoc.addPage([
      canvas.width,
      canvas.height
    ]);

    const pngImage = await pdfDoc.embedPng(imageDataUrl);

    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    });

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([new Uint8Array(pdfBytes)], {
      type: "application/pdf"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "redacted-secure.pdf";

    a.click();

    URL.revokeObjectURL(url);

  } catch (error) {

    console.error(error);

  }

  setLoading(false);
};


  return (

    <div className="min-h-screen flex flex-col items-center p-6">

      <h1 className="text-3xl font-bold mb-6">
        PDF Redactor Tool
      </h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="mb-4"
      />

      {file && (
        <p className="mb-4 text-sm text-gray-600">
          Selected: {file.name}
        </p>
      )}

      {/* Canvas container */}
      <div style={{ position: "relative" }}>

        <canvas
          ref={canvasRef}
          className="border shadow max-w-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />

        {rectangles.map((rect, index) => (

          <div
            key={index}
            style={{
              position: "absolute",
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              backgroundColor: "black",
              opacity: 1,
              pointerEvents: "none",
            }}
          />

        ))}

      </div>

      <button
        onClick={handleRedactPDF}
        disabled={!file || rectangles.length === 0 || loading}
        className="mt-6 bg-black text-white px-6 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Processing..." : "Redact and Download PDF"}
      </button>

    </div>
  );
}
