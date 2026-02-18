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

      <div className="grid gap-4">
        {deletedFiles.map((file, index) => (
          <div
            key={index}
            className="p-5 rounded-2xl border border-danger/20 bg-danger/5 backdrop-blur-sm shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-premium transition-all group"
          >
            <div>
              <p className="font-bold text-foreground group-hover:text-danger transition-colors">{file.fileName}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-danger/10 text-danger text-[10px] font-bold uppercase tracking-wider">{file.tool}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{file.time}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-xs text-danger font-medium">Deleted: {file.deletedTime}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onRestore(index)}
                className="p-2.5 text-success hover:bg-success/10 rounded-full transition-colors"
                title="Restore"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={() => onPermanentDelete(index)}
                className="p-2.5 text-danger hover:bg-danger/10 rounded-full transition-colors"
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


