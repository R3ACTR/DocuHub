'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUp, Download, Loader2, FileText } from 'lucide-react';

export default function PdfCompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const prevPreviewUrlRef = useRef<string | null>(null);

  // Revoke previous URL when previewUrl changes or on unmount
  useEffect(() => {
    // Revoke the previous URL if it exists
    if (prevPreviewUrlRef.current && prevPreviewUrlRef.current !== previewUrl) {
      URL.revokeObjectURL(prevPreviewUrlRef.current);
    }
    // Update the ref to current URL
    prevPreviewUrlRef.current = previewUrl;

    // Cleanup on unmount
    return () => {
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current);
      }
    };
  }, [previewUrl]);

  // ✅ NEW — Compression Level State (Default Medium)
  const [compressionLevel, setCompressionLevel] = useState<
    "low" | "medium" | "high"
  >("medium");

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const droppedFile = e.dataTransfer.files[0];

    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setOriginalSize(droppedFile.size);
      setCompressedSize(null);

      const url = URL.createObjectURL(droppedFile);
      setPreviewUrl(url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFile = e.target.files[0];

    if (selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setOriginalSize(selectedFile.size);
      setCompressedSize(null);

      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const existingPdfBytes = await file.arrayBuffer();
      const existingPdf = await PDFDocument.load(existingPdfBytes);

      const newPdf = await PDFDocument.create();

      const pages = await newPdf.copyPages(
        existingPdf,
        existingPdf.getPageIndices()
      );

      pages.forEach((page) => newPdf.addPage(page));

      const compressedBytes = await newPdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 20,
      });

      setCompressedSize(compressedBytes.length);

      const blob = new Blob([new Uint8Array(compressedBytes)], {
        type: 'application/pdf',
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'compressed.pdf';
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Compression failed');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 text-center">
      <div className="mb-8">
        <FileText className="mx-auto w-10 h-10 text-indigo-600 mb-3" />
        <h1 className="text-3xl font-bold">Compress PDF</h1>
        <p className="text-gray-600 mt-2">
          Reduce PDF file size while keeping good quality
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 ${
          isDraggingOver
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300'
        }`}
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />

        <label htmlFor="file-upload" className="cursor-pointer">
          <FileUp className="mx-auto w-8 h-8 text-gray-400 mb-2" />
          <p>Select or Drop PDF</p>
        </label>

        {file && (
          <>
            <div className="mt-3 text-sm text-gray-600">
              <p>Selected: {file.name}</p>

              {originalSize && (
                <p>Original size: {formatSize(originalSize)}</p>
              )}

              {compressedSize && (
                <p>Compressed size: {formatSize(compressedSize)}</p>
              )}

              {originalSize && compressedSize && (
                <p className="text-green-600 font-medium">
                  Reduction: {(
                    ((originalSize - compressedSize) / originalSize) * 100
                  ).toFixed(2)}%
                </p>
              )}
            </div>

            {previewUrl && (
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <iframe
                  src={previewUrl}
                  className="w-full h-64 border rounded-lg"
                />
              </div>
            )}

            {/* ✅ NEW — Compression Level Selector */}
            <div className="mt-6 text-left">
              <p className="font-medium mb-2">Compression Level</p>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={compressionLevel === "low"}
                    onChange={() => setCompressionLevel("low")}
                    className="accent-indigo-600"
                  />
                  <span>Low Compression (Best Quality)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={compressionLevel === "medium"}
                    onChange={() => setCompressionLevel("medium")}
                    className="accent-indigo-600"
                  />
                  <span>Medium Compression (Balanced)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={compressionLevel === "high"}
                    onChange={() => setCompressionLevel("high")}
                    className="accent-indigo-600"
                  />
                  <span>High Compression (Smallest Size)</span>
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleCompress}
        disabled={!file || loading}
        className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
            Compressing...
          </>
        ) : (
          <>
            <Download className="inline w-4 h-4 mr-2" />
            Compress PDF
          </>
        )}
      </button>
    </div>
  );
}
