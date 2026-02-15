"use client";

import { useEffect, useState } from "react";

type DeletedFile = {
  fileName: string;
  tool: string;
  time: string;
  deletedTime: string;
};

export default function RecentlyDeletedFiles() {
  const [deletedFiles, setDeletedFiles] = useState<DeletedFile[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("deletedRecentFiles");
    if (stored) {
      setDeletedFiles(JSON.parse(stored));
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("deletedRecentFiles");
    setDeletedFiles([]);
  };

  if (deletedFiles.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-red-600">
          Recently Deleted
        </h2>

        <button
          onClick={clearHistory}
          className="text-sm px-3 py-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-3">
        {deletedFiles.map((file, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border bg-red-50 shadow-sm flex justify-between"
          >
            <div>
              <p className="font-medium">{file.fileName}</p>
              <p className="text-sm text-gray-500">
                {file.tool} • {file.time}
              </p>
              <p className="text-xs text-red-500 mt-1">
                Deleted: {file.deletedTime}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
