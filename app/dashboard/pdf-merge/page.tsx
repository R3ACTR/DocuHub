'use client';

import { useState, useEffect } from 'react';
import { PDFDocument, PDFPage } from 'pdf-lib';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortablePdfItem } from '@/components/SortablePdfItem';
import { FileUp, Trash2, Combine, FileText, Loader2 } from 'lucide-react';

interface FileWithId {
  id: string;
  file: File;
  uploadedAt: number;
}

export default function PdfMergePage() {
  const [filesWithIds, setFilesWithIds] = useState<FileWithId[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [, forceUpdate] = useState(0);

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const sec = Math.floor(diff / 1000);

    if (sec < 5) return 'Uploaded just now';
    if (sec < 60) return `Uploaded ${sec}s ago`;

    const min = Math.floor(sec / 60);
    if (min < 60) return `Uploaded ${min} min ago`;

    const hr = Math.floor(min / 60);
    return `Uploaded ${hr} hr ago`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const replaceFile = (idToReplace: string, newFile: File) => {
    if (newFile.type !== 'application/pdf') return;

    setFilesWithIds((prev) =>
      prev.map((item) =>
        item.id === idToReplace
          ? { ...item, file: newFile, uploadedAt: Date.now() }
          : item
      )
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => setIsDraggingOver(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf'
    );

    if (droppedFiles.length === 0) return;

    const newFiles = droppedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      uploadedAt: Date.now(),
    }));

    setFilesWithIds((prev) => [...prev, ...newFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files).filter(
      (file) => file.type === 'application/pdf'
    );

    const newFiles = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      uploadedAt: Date.now(),
    }));

    setFilesWithIds((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (idToRemove: string) => {
    setFilesWithIds((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  /* ✅ ONLY CHANGE MADE HERE */
  const clearAll = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to remove all uploaded files?"
    );

    if (confirmClear) {
      setFilesWithIds([]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFilesWithIds((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleMerge = async () => {
    if (filesWithIds.length < 2) {
      alert('Please select at least 2 PDF files');
      return;
    }

    setLoading(true);
    setUploadProgress(10);

    try {
      const mergedPdf = await PDFDocument.create();
      let processed = 0;

      for (const item of filesWithIds) {
        const bytes = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page: PDFPage) => mergedPdf.addPage(page));

        processed++;
        setUploadProgress(10 + (processed / filesWithIds.length) * 80);
      }

      const mergedBytes = await mergedPdf.save();
      setUploadProgress(95);

      const blob = new Blob([new Uint8Array(mergedBytes)], {
        type: 'application/pdf',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      a.click();
      URL.revokeObjectURL(url);

      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      alert('Failed to merge PDFs');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setUploadProgress(0);
      }, 600);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <input
        type="file"
        accept="application/pdf"
        id="replace-file-input"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const id = e.currentTarget.getAttribute('data-replace-id');
          if (file && id) replaceFile(id, file);
          e.currentTarget.value = '';
        }}
      />

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl text-indigo-600 mb-4">
          <Combine className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Merge PDF Files</h1>
        <p className="mt-2 text-lg text-gray-600">
          Combine multiple PDF documents into a single file. Reorder them as needed.
        </p>
      </div>

      {loading && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Processing… {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      <div
        tabIndex={0}
        aria-label="Upload PDF files"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all
          ${
            isDraggingOver
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
      >
        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-default"
        />

        <div className="flex flex-col items-center">
          <div className="p-4 bg-gray-50 rounded-full mb-4">
            <FileUp className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isDraggingOver ? 'Drop files here' : 'Select PDF files to merge'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Drag and drop files here, or click to browse
          </p>
        </div>
      </div>

      {filesWithIds.length > 0 && (
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">
                {filesWithIds.length} files selected
              </h2>
            </div>

            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={filesWithIds.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {filesWithIds.map((item, index) => (
                  <div key={item.id} className="relative">
                    <SortablePdfItem
                      id={item.id}
                      file={item.file}
                      index={index}
                      uploadedTime={getRelativeTime(item.uploadedAt)}
                      onRemove={() => removeFile(item.id)}
                    />

                    <button
                      onClick={() => {
                        const input = document.getElementById(
                          'replace-file-input'
                        ) as HTMLInputElement;
                        if (input) {
                          input.setAttribute('data-replace-id', item.id);
                          input.click();
                        }
                      }}
                      className="absolute right-20 top-4 text-sm px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    >
                      Replace
                    </button>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="pt-6 flex justify-center">
            <button
              onClick={handleMerge}
              disabled={loading || filesWithIds.length < 2}
              className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Merging…
                </>
              ) : (
                <>
                  <Combine className="w-5 h-5" />
                  Merge PDFs
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

