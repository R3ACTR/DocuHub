"use client";

import React, { useState } from "react";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt-lite";
import { FileUp, Lock, Loader2, FileText } from "lucide-react";

export default function PdfProtectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // feedback states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const droppedFile = e.dataTransfer.files[0];

    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError("");
      setSuccess("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFile = e.target.files[0];

    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
      setSuccess("");
    }
  };

  const protectPdf = async () => {
    // Reset messages
    setError("");
    setSuccess("");

    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    try {
      setLoading(true);

      const pdfBytes = new Uint8Array(await file.arrayBuffer());

      const encryptedBytes = await encryptPDF(pdfBytes, password, password);

      const blob = new Blob([new Uint8Array(encryptedBytes)], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "protected.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      // Success message
      setSuccess("PDF protected and downloaded successfully!");
    } catch (err) {
      console.error(err);
      setError("Encryption failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl text-indigo-600 mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold">Protect PDF</h1>
        <p className="text-gray-600 mt-2">
          Add password protection to your PDF file
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded">
          {success}
        </div>
      )}

      {/* File Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 ${
          isDraggingOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
        }`}
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />

        <label htmlFor="file-upload" className="cursor-pointer">
          {file ? (
            <div className="text-center">
              <FileText className="mx-auto w-10 h-10 text-indigo-600 mb-2" />
              <p className="font-medium text-gray-700">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-sm text-indigo-600 mt-2">Click to replace</p>
            </div>
          ) : (
            <>
              <FileUp className="mx-auto w-8 h-8 text-gray-400 mb-2" />
              <p>Select or Drop PDF</p>
            </>
          )}
        </label>
      </div>

      {/* Password Input - shows after file is selected */}
      {file && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Password
          </label>
          <input
            type="password"
            placeholder="Password to protect PDF"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      )}

      {/* Protect Button */}
      <button
        onClick={protectPdf}
        disabled={!file || !password || loading}
        className="mt-6 w-full px-6 py-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
      >
        {loading ? (
          <>
            <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
            Protecting...
          </>
        ) : (
          <>
            <Lock className="inline w-4 h-4 mr-2" />
            Protect PDF
          </>
        )}
      </button>
    </div>
  );
}
