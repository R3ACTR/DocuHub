"use client";

import { Trash2 } from "lucide-react";

export type RecentFile = {
  fileName: string;
  tool: string;
  time: string;
};

interface RecentFilesProps {
  files: RecentFile[];
  onDelete: (index: number) => void;
  onClear: () => void;
}

export default function RecentFiles({ files, onDelete, onClear }: RecentFilesProps) {
  if (files.length === 0) return null;

  return (
    <div className="mt-12">
      {/* Header with Clear Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Files</h2>

        <button
          onClick={onClear}
          className="text-red-500 hover:text-red-700 text-sm font-medium"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-3">
        {files.map((file, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border bg-white shadow-sm flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{file.fileName}</p>
              <p className="text-sm text-gray-500">
                {file.tool} • {file.time}
              </p>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => onDelete(index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
