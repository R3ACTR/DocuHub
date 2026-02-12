'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PdfThumbnail } from './PdfThumbnail';
import { Trash2, GripVertical } from 'lucide-react';

interface SortablePdfItemProps {
  id: string;
  file: File;
  index: number;
  onRemove: () => void;
}

export function SortablePdfItem({ id, file, index, onRemove }: SortablePdfItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg border-indigo-300' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-shrink-0">
        <PdfThumbnail file={file} className="w-16 h-20 shadow-sm rounded" />
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
            {index + 1}
          </span>
          <p className="font-medium text-gray-900 truncate" title={file.name}>
            {file.name}
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {formatFileSize(file.size)}
        </p>
      </div>

      {/* ✅ Updated Remove Button (Icon + Text) */}
      <button
        onClick={onRemove}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
        title="Remove file"
      >
        <Trash2 className="w-4 h-4" />
        Remove
      </button>
    </div>
  );
}
