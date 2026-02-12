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

  if (deletedFiles.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-xl font-semibold mb-4 text-red-600">
        Recently Deleted
      </h2>

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
