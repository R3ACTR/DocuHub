"use client";

import { Trash2, RotateCcw } from "lucide-react";
import { DeletedFile } from "@/lib/hooks/useRecentFiles";

interface RecentlyDeletedFilesProps {
  deletedFiles: DeletedFile[];
  onRestore: (index: number) => void;
  onPermanentDelete: (index: number) => void;
  onClear: () => void;
}

export default function RecentlyDeletedFiles({
  deletedFiles,
  onRestore,
  onPermanentDelete,
  onClear,
}: RecentlyDeletedFilesProps) {
  if (deletedFiles.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-danger">Recently Deleted</h2>

        <button
          onClick={onClear}
          className="text-sm px-3 py-1.5 rounded-md bg-danger/10 text-danger hover:bg-danger/20 transition"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-3">
        {deletedFiles.map((file, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border bg-card shadow-sm flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{file.fileName}</p>
              <p className="text-sm text-muted-foreground">
                {file.tool} • {file.time}
              </p>
              <p className="text-xs text-danger mt-1">
                Deleted: {file.deletedTime}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onRestore(index)}
                className="p-2 text-success hover:bg-success/10 rounded-full transition"
                title="Restore"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={() => onPermanentDelete(index)}
                className="p-2 text-danger hover:bg-danger/10 rounded-full transition"
                title="Permanently Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


