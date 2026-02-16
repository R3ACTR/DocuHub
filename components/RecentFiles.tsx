"use client";

import { Trash2, FileText as FileIcon } from "lucide-react";

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Recent Files</h2>

        <button
          onClick={onClear}
          className="text-sm px-4 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-medium"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-3">
        {files.map((file, index) => (
          <div
            key={index}
            className="group p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all flex justify-between items-center"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-500">
                <FileIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">{file.fileName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                    {file.tool.replace("-", " ")}
                  </span>
                  <span>{file.time}</span>
                </div>
              </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onDelete(index)}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete"
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
