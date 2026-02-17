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
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  useEffect(() => {
    if (!filesWithIds.length) {
      setPreviewFileId(null);
      setPreviewUrl(null);
      return;
    }

    const currentPreviewId = previewFileId ?? filesWithIds[0].id;
    const currentItem = filesWithIds.find((item) => item.id === currentPreviewId) || filesWithIds[0];
    const objectUrl = URL.createObjectURL(currentItem.file);
    setPreviewFileId(currentItem.id);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [filesWithIds, previewFileId]);

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

  const handleReplacePreviewFile = () => {
    if (!previewFileId) return;
    const input = document.getElementById('replace-file-input') as HTMLInputElement | null;
    if (!input) return;
    input.setAttribute('data-replace-id', previewFileId);
    input.click();
  };

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
      </div>

      <div
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-12 text-center`}
      >
        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0"
        />

        <FileUp className="mx-auto mb-4 text-gray-400" />
        <p>Select or drop PDF files</p>
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
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clearAll();
              }}
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
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Preview Before Merge</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReplacePreviewFile}
                  disabled={!previewFileId}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Replace Selected
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filesWithIds.map((item) => (
                <button
                  key={`preview-${item.id}`}
                  type="button"
                  onClick={() => setPreviewFileId(item.id)}
                  className={`px-3 py-1.5 text-xs rounded-full border ${
                    previewFileId === item.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.file.name}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              {previewUrl ? (
                <iframe src={previewUrl} title="PDF preview before merge" className="w-full h-[460px]" />
              ) : (
                <div className="p-6 text-sm text-gray-600">Select a PDF to preview.</div>
              )}
            </div>
          </div>

          <div className="pt-6 flex justify-center">
            <button
              onClick={handleMerge}
              disabled={loading || filesWithIds.length < 2}
              className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-2xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Merging…
                </>
              ) : (
                <>
                  <Combine className="w-5 h-5" />
                  Confirm & Continue
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
