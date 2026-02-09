"use client";

import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import {
  FileUp,
  Shield,
  Download,
  Loader2,
  FileText,
} from "lucide-react";

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
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
const [pdfDoc, setPdfDoc] = useState<any>(null);
const [pageNumber, setPageNumber] = useState(1);
const [totalPages, setTotalPages] = useState(0);

  // Load PDF
  const loadPDF = async (selectedFile: File) => {
    setFile(selectedFile);
    setRectangles([]);

    const arrayBuffer = await selectedFile.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
  data: arrayBuffer,
}).promise;

setPdfDoc(pdf);
setTotalPages(pdf.numPages);
setPageNumber(1);

await renderPage(pdf, 1);

  };

  // File input change
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await loadPDF(selectedFile);
  };

  // Drag drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const droppedFile = e.dataTransfer.files?.[0];

    if (droppedFile && droppedFile.type === "application/pdf") {
      await loadPDF(droppedFile);
    }
  };

  // Render PDF
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

  const goToNextPage = async () => {
  if (!pdfDoc || pageNumber >= totalPages) return;

  const nextPage = pageNumber + 1;
  setPageNumber(nextPage);
  await renderPage(pdfDoc, nextPage);
};

const goToPrevPage = async () => {
  if (!pdfDoc || pageNumber <= 1) return;

  const prevPage = pageNumber - 1;
  setPageNumber(prevPage);
  await renderPage(pdfDoc, prevPage);
};


  // Drawing logic
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPoint({ x, y });
    setIsDrawing(true);

    setRectangles((prev) => [
      ...prev,
      { x, y, width: 0, height: 0 },
    ]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setRectangles((prev) => {
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

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Redact
  const handleRedactPDF = async () => {
    if (!canvasRef.current) return;

    setLoading(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      rectangles.forEach((rect) => {
        ctx.fillStyle = "black";
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      });

      const imageDataUrl = canvas.toDataURL("image/png");

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([
        canvas.width,
        canvas.height,
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
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "redacted-secure.pdf";
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex p-3 bg-indigo-100 rounded-2xl text-indigo-600 mb-4">
          <Shield className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900">
          PDF Redactor
        </h1>

        <p className="mt-2 text-gray-600">
          Securely redact sensitive information from your PDF.
        </p>
      </div>

      {/* Upload box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition ${
          isDraggingOver
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center">
          <FileUp className="w-10 h-10 text-gray-400 mb-3" />

          <h3 className="font-semibold text-lg">
            {file ? "Replace PDF file" : "Select PDF file"}
          </h3>

          <p className="text-sm text-gray-500">
            Drag & drop or click to upload
          </p>
        </div>
      </div>

      {/* File info */}
      {file && (
        <div className="mt-6 flex items-center gap-2 text-gray-700">
          <FileText className="w-5 h-5 text-indigo-600" />
          {file.name}
        </div>
      )}
<div className="flex justify-between items-center mt-4">
  <button
    onClick={goToPrevPage}
    disabled={pageNumber <= 1}
    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
  >
    Previous
  </button>

  <span>
    Page {pageNumber} of {totalPages}
  </span>

  <button
    onClick={goToNextPage}
    disabled={pageNumber >= totalPages}
    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
  >
    Next
  </button>
</div>

      {/* Canvas */}
      {file && (
        <div className="mt-6 border rounded-xl shadow overflow-auto relative">
          <canvas
            ref={canvasRef}
            className="max-w-full"
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
              }}
            />
          ))}
        </div>
      )}

      {/* Button */}
      {file && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleRedactPDF}
            disabled={loading || rectangles.length === 0}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-2xl shadow hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Redact & Download
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}