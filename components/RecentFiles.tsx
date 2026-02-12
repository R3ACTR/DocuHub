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
          </div>
        ))}
      </div>
    </div>
  );
}
