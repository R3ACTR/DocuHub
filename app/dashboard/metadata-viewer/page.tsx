'use client';

import { useState } from 'react';
import { FileUp, FileText, Info, Database } from 'lucide-react';
import * as exifr from 'exifr';

export default function MetadataViewerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      try {
        const meta = await exifr.parse(selectedFile);
        setMetadata(meta);
      } catch (error) {
        console.log('Metadata extraction failed:', error);
        setMetadata(null);
      }
    }
  };

  const formatSize = (size: number) => {
    if (size < 1024) return size + ' bytes';
    if (size < 1024 * 1024)
      return (size / 1024).toFixed(2) + ' KB';
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">

      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6">

          <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" />
            Metadata Viewer
          </h1>

          {/* Upload Box */}
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition">

            <FileUp className="w-10 h-10 mb-2 text-blue-500" />

            <span className="text-gray-600 dark:text-gray-300 font-medium">
              Click to upload a file
            </span>

            <span className="text-xs text-gray-400 mt-1">
              Supports images, PDFs, and more
            </span>

            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />

          </label>

        </div>

        {/* File Info Card */}
        {file && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6">

            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-green-500" />
              File Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

              <div>
                <span className="text-gray-500">Name</span>
                <div className="font-medium break-all">
                  {file.name}
                </div>
              </div>

              <div>
                <span className="text-gray-500">Type</span>
                <div className="font-medium">
                  {file.type || 'Unknown'}
                </div>
              </div>

              <div>
                <span className="text-gray-500">Size</span>
                <div className="font-medium">
                  {formatSize(file.size)}
                </div>
              </div>

              <div>
                <span className="text-gray-500">Last Modified</span>
                <div className="font-medium">
                  {new Date(
                    file.lastModified
                  ).toLocaleString()}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Metadata Card */}
        {metadata && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6">

            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              Detailed Metadata
            </h2>

            <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 max-h-[400px] overflow-auto">

              <pre className="text-xs whitespace-pre-wrap break-words">
                {JSON.stringify(metadata, null, 2)}
              </pre>

            </div>

          <div>
            <strong>Size:</strong> {formatSize(file.size)}
          </div>

      </div>

    </div>

  </div>
  );
}
