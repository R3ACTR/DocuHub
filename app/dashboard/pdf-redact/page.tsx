"use client";

import { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import {
  FileUp,
  Shield,
  Download,
  Loader2,
  FileText,
} from "lucide-react";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function PdfRedactPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rectanglesByPage, setRectanglesByPage] = useState<{
    [page: number]: Rect[];
  }>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [tool, setTool] = useState<"redact" | "erase">("redact");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const rectangles = rectanglesByPage[pageNumber] || [];
  const [totalPages, setTotalPages] = useState(0);
  const pdfjsRef = useRef<typeof import("pdfjs-dist") | null>(null);

  // Load pdfjs-dist dynamically (client-only to avoid SSR crash)
  useEffect(() => {
    let cancelled = false;

    const loadPdfJs = async () => {
      const pdfjsLib = await import("pdfjs-dist");
      if (cancelled) return;

      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();

      pdfjsRef.current = pdfjsLib;
    };

    loadPdfJs();
    return () => { cancelled = true; };
  }, []);

  // Load PDF
  const loadPDF = async (selectedFile: File) => {
    if (!pdfjsRef.current) return; // Wait until pdfjs is loaded

    setFile(selectedFile);
    setRectanglesByPage({});

    const arrayBuffer = await selectedFile.arrayBuffer();

    const pdf = await pdfjsRef.current.getDocument({
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
      canvas,
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


const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // ERASE MODE
  if (tool === "erase") {
  setRectanglesByPage((prev) => {
    const pageRects = prev[pageNumber] || [];

    const filtered = pageRects.filter((r) => {
      const padding = 4; // makes erase easier

      return !(
        x >= r.x - padding &&
        x <= r.x + r.width + padding &&
        y >= r.y - padding &&
        y <= r.y + r.height + padding
      );
    });

    return {
      ...prev,
      [pageNumber]: filtered,
    };
  });

  return;
}


  // REDACT MODE
  setStartPoint({ x, y });
  setIsDrawing(true);

  setRectanglesByPage((prev) => {
    const pageRects = prev[pageNumber] || [];

    return {
      ...prev,
      [pageNumber]: [
        ...pageRects,
        { x, y, width: 0, height: 0 },
      ],
    };
  });
};


  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    setRectanglesByPage((prev) => {
  const pageRects = [...(prev[pageNumber] || [])];
  const last = pageRects.length - 1;

  if (last < 0) return prev;

  pageRects[last] = {
    x: Math.min(startPoint.x, currentX),
    y: Math.min(startPoint.y, currentY),
    width: Math.abs(currentX - startPoint.x),
    height: Math.abs(currentY - startPoint.y),
  };

  return {
    ...prev,
    [pageNumber]: pageRects,
  };
});

  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Redact
// Redact
const handleRedactPDF = async () => {
  if (!file || !pdfjsRef.current) return;

  setLoading(true);

  try {
    const arrayBuffer = await file.arrayBuffer();

    // Load original PDF using pdfjsRef (NOT pdfjsLib)
    const originalPdf = await pdfjsRef.current.getDocument({
      data: arrayBuffer,
    }).promise;

    // Create new PDF
    const newPdf = await PDFDocument.create();

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) {
      setLoading(false);
      return;
    }

    // Process ALL pages
    for (let i = 1; i <= originalPdf.numPages; i++) {
      const page = await originalPdf.getPage(i);

      const viewport = page.getViewport({ scale: 1.5 });

      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;

      // Clear previous render
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Render page
      await page.render({
        canvasContext: tempCtx,
        viewport,
        canvas: tempCanvas,
      }).promise;

      // Apply redactions
      const rects = rectanglesByPage[i] || [];

      rects.forEach((rect) => {
        tempCtx.fillStyle = "black";
        tempCtx.fillRect(rect.x, rect.y, rect.width, rect.height);
      });

      // Convert to image
      const imageDataUrl = tempCanvas.toDataURL("image/png");

      const pngImage = await newPdf.embedPng(imageDataUrl);

      const newPage = newPdf.addPage([
        viewport.width,
        viewport.height,
      ]);

      newPage.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      });
    }

    // Save PDF
    const pdfBytes = await newPdf.save();

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
    console.error("Redaction failed:", err);
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
{/* Tool selector */}
{file && (
  <div className="mt-6 flex flex-wrap gap-3 bg-gray-50 p-3 rounded-2xl border">

    <button
      onClick={() => setTool("redact")}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
        tool === "redact"
          ? "bg-indigo-600 text-white shadow"
          : "bg-white text-gray-700 hover:bg-gray-100 border"
      }`}
    >
      <Shield className="w-4 h-4" />
      Redact
    </button>

    <button
      onClick={() => setTool("erase")}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
        tool === "erase"
          ? "bg-red-600 text-white shadow"
          : "bg-white text-gray-700 hover:bg-gray-100 border"
      }`}
    >
      Eraser
    </button>

  </div>
)}


{/* Page Navigation */}
{file && (
  <div className="mt-6 flex items-center justify-between bg-white border rounded-2xl px-4 py-3 shadow-sm">

    <button
      onClick={goToPrevPage}
      disabled={pageNumber <= 1}
      className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      ← Previous
    </button>

    <div className="text-sm font-medium text-gray-700">
      Page <span className="text-indigo-600">{pageNumber}</span> of {totalPages}
    </div>

    <button
      onClick={goToNextPage}
      disabled={pageNumber >= totalPages}
      className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      Next →
    </button>

  </div>
)}


{/* Canvas */}
{file && (
  <div className="mt-6 bg-white border rounded-2xl shadow-sm p-4">

    <div className="relative overflow-auto rounded-xl border bg-gray-50 flex justify-center">

      <canvas
        ref={canvasRef}
        className="max-w-full rounded-lg shadow"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {rectangles.map((rect, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            pointerEvents: "none",
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            backgroundColor: "black",
            borderRadius: "4px",
          }}
        />
      ))}

    </div>

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