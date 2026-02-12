'use client';

import { useState } from 'react';
import { FileUp, FileText } from 'lucide-react';
import * as exifr from 'exifr';


export default function MetadataViewerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<any>(null);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    try {
      const meta = await exifr.parse(selectedFile);
      setMetadata(meta);
    } catch (error) {
      console.log("Metadata extraction failed:", error);
      setMetadata(null);
    }
  }
};


  const formatSize = (size: number) => {
    if (size < 1024) return size + ' bytes';
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
  <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">

    <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6">

      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FileText className="w-6 h-6" />
        Metadata Viewer
      </h1>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 cursor-pointer hover:border-blue-500 transition">

        <FileUp className="w-8 h-8 mb-2" />

        <span className="text-gray-600 dark:text-gray-300">
          Click to upload a file
        </span>

        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

      </label>

      {file && (
        <div className="mt-6 space-y-2">

          <div>
            <strong>Name:</strong> {file.name}
          </div>

          <div>
            <strong>Type:</strong> {file.type || 'Unknown'}
          </div>

          <div>
            <strong>Size:</strong> {formatSize(file.size)}
          </div>

          <div>
            <strong>Last Modified:</strong>{' '}
            {new Date(file.lastModified).toLocaleString()}
          </div>

        </div>
      )}

      {/* FILE PREVIEW */}
      {file && (
        <div className="mt-6">

          <strong>File Preview:</strong>

          {/* Image preview */}
          {file.type.startsWith("image/") && (
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="mt-2 rounded-lg max-h-64"
            />
          )}

          {/* PDF preview */}
          {file.type === "application/pdf" && (
            <iframe
              src={URL.createObjectURL(file)}
              className="mt-2 w-full h-64 rounded-lg"
            />
          )}

          {/* Text preview */}
          {file.type.startsWith("text/") && (
            <iframe
              src={URL.createObjectURL(file)}
              className="mt-2 w-full h-64 rounded-lg"
            />
          )}

        </div>
      )}

      {/* METADATA */}
      {metadata && (
        <div className="mt-4">

          <strong>Detailed Metadata:</strong>

          <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded mt-2 text-xs overflow-auto">
            {JSON.stringify(metadata, null, 2)}
          </pre>

        </div>
      )}

    </div>

  </div>
  );
}
