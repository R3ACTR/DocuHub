"use client";

import { useEffect, useState } from "react";

type RecentFile = {
  fileName: string;
  tool: string;
  time: string;
};

export default function RecentFiles() {
  const [files, setFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("recentFiles");
    if (stored) {
      setFiles(JSON.parse(stored) as RecentFile[]);
    }
  }, []);

  // ✅ UPDATED — Delete Function (Now Also Saves Deleted History)
  const handleDelete = (indexToDelete: number) => {
    const fileToDelete = files[indexToDelete];

    // Remove from recent files
    const updatedFiles = files.filter((_, index) => index !== indexToDelete);
    setFiles(updatedFiles);
    localStorage.setItem("recentFiles", JSON.stringify(updatedFiles));

    // ✅ Add to deleted history
    const deletedStored = localStorage.getItem("deletedRecentFiles");
    const deletedFiles = deletedStored ? JSON.parse(deletedStored) : [];

    const deletedEntry = {
      ...fileToDelete,
      deletedTime: new Date().toLocaleString(),
    };

    deletedFiles.unshift(deletedEntry);
    localStorage.setItem("deletedRecentFiles", JSON.stringify(deletedFiles));
  };

  if (files.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-xl font-semibold mb-4">Recent Files</h2>

      <div className="space-y-3">
        {files.map((file, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border bg-white shadow-sm flex justify-between"
          >
            <div>
              <p className="font-medium">{file.fileName}</p>
              <p className="text-sm text-gray-500">
                {file.tool} • {file.time}
              </p>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => handleDelete(index)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
