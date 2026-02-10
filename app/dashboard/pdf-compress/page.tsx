'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUp, Download, Loader2, FileText } from 'lucide-react';

export default function PdfCompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const droppedFile = e.dataTransfer.files[0];

    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFile = e.target.files[0];

    if (selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
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
          <p className="mt-3 text-sm text-gray-600">
            Selected: {file.name}
          </p>
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
