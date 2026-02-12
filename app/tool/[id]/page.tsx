"use client";
<<<<<<< persist-tool-state
=======
import { Minimize2, X } from "lucide-react";
>>>>>>> main

import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Combine,
  Scissors,
  FileUp,
  Loader2,
  FileText,
  Minimize2,
} from "lucide-react";

import { ToolCard } from "@/components/ToolCard";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import { storeFile } from "@/lib/fileStore";
import {
  saveToolState,
  loadToolState,
  clearToolState,
} from "@/lib/toolStateStorage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ToolUploadPage() {
  const router = useRouter();
  const params = useParams();

  const toolId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [hasUnsavedWork, setHasUnsavedWork] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 🔹 Persisted metadata (NOT File object)
  const [persistedFileMeta, setPersistedFileMeta] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

  /* --------------------------------------------
     Restore persisted state on refresh
  --------------------------------------------- */
  useEffect(() => {
    if (!toolId) return;

    const stored = loadToolState(toolId);
    if (stored?.fileMeta) {
      setPersistedFileMeta(stored.fileMeta);
    }
  }, [toolId]);

  /* --------------------------------------------
     Persist state when file changes
  --------------------------------------------- */
  useEffect(() => {
    if (!toolId) return;

    if (selectedFile) {
      saveToolState(toolId, {
        fileMeta: {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
        },
      });
    }
  }, [toolId, selectedFile]);

  /* --------------------------------------------
     Remember last-used tool + analytics
  --------------------------------------------- */
  useEffect(() => {
    if (!toolId || toolId === "pdf-tools") return;

    localStorage.setItem("lastUsedTool", toolId);
    localStorage.removeItem("hideResume");

    const existing = JSON.parse(
      localStorage.getItem("recentTools") || "[]"
    );

    const updated = [
      toolId,
      ...existing.filter((t: string) => t !== toolId),
    ].slice(0, 5);

    localStorage.setItem("recentTools", JSON.stringify(updated));
  }, [toolId]);

  /* --------------------------------------------
     Warn before refresh
  --------------------------------------------- */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedWork) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedWork]);

  const getSupportedTypes = () => {
    switch (toolId) {
      case "ocr":
        return [".jpg", ".jpeg", ".png"];
      case "pdf-merge":
      case "pdf-split":
      case "pdf-protect":
      case "pdf-redact":
        return [".pdf"];
      default:
        return [];
    }
  };

  /* --------------------------------------------
     FILE INPUT
  --------------------------------------------- */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = getSupportedTypes();
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (allowed.length && !allowed.includes(ext)) {
      setFileError(`Unsupported file type. Allowed: ${allowed.join(", ")}`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `File too large (${(file.size / 1024 / 1024).toFixed(
          1
        )}MB). Max 10MB.`
      );
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    setHasUnsavedWork(true);
  };

<<<<<<< persist-tool-state
  /* --------------------------------------------
     PROCESS FILE
  --------------------------------------------- */
=======
  /* REMOVE FILE */
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFiles([]);
    setHasUnsavedWork(false);
  };

  /* PROCESS FILE */
>>>>>>> main
  const handleProcessFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    try {
      const ok = await storeFile(selectedFile);

      if (ok) {
        clearToolState(toolId);
        router.push(`/tool/${toolId}/processing`);
      } else {
        setFileError("Failed to process file.");
      }
    } catch {
      setFileError("Unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  /* --------------------------------------------
     PDF TOOLS PAGE
  --------------------------------------------- */
  if (toolId === "pdf-tools") {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="container mx-auto px-6 py-12 md:px-12">
          <h1 className="text-3xl font-semibold mb-2">PDF Tools</h1>
          <p className="text-muted-foreground mb-12">Choose a PDF tool</p>

          <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
            <ToolCard
              icon={Combine}
              title="Merge PDF"
              description="Combine multiple PDFs"
              href="/dashboard/pdf-merge"
            />
            <ToolCard
              icon={Minimize2}
              title="Compress PDF"
              description="Reduce PDF file size"
              href="/tool/pdf-compress"
            />
            <ToolCard
              icon={Scissors}
              title="Split PDF"
              description="Split PDF pages"
              href="/dashboard/pdf-split"
            />
            <ToolCard
              icon={FileText}
              title="Protect PDF"
              description="Add password protection"
              href="/tool/pdf-protect"
            />
            <ToolCard
              icon={FileUp}
              title="Document to PDF"
              description="Convert documents to PDF"
              href="/dashboard/document-to-pdf"
            />
          </div>
        </main>
      </div>
    );
  }

  /* --------------------------------------------
     UPLOAD PAGE
  --------------------------------------------- */
  return (
    <div className="min-h-screen flex flex-col">
      <main className="container mx-auto px-6 py-12 md:px-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-semibold mb-8">
          Upload your file
        </h1>

        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          className={`border-2 border-dashed rounded-xl p-20 text-center cursor-pointer ${
            isDraggingOver
              ? "border-blue-500 bg-blue-50"
              : "hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <Upload className="mx-auto mb-4" />
          <p>
            {persistedFileMeta
              ? `Previously selected: ${persistedFileMeta.name}`
              : "Drag & drop or click to browse"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={getSupportedTypes().join(",")}
            onChange={handleFile}
          />
        </motion.div>

        {selectedFile && (
<<<<<<< persist-tool-state
          <div className="mt-4">
            <p className="font-medium">{selectedFile.name}</p>
=======
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl border bg-white shadow-sm">
              <FileText className="w-8 h-8 text-blue-500" />

              <div className="flex-1">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                onClick={handleRemoveFile}
                className="p-2 hover:bg-red-50 rounded-lg transition"
              >
                <X className="w-5 h-5 text-red-500" />
              </button>

              {isProcessing && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              )}
            </div>

            {isProcessing && (
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-blue-600 animate-pulse w-full" />
              </div>
            )}

>>>>>>> main
            <button
              onClick={handleProcessFile}
              disabled={isProcessing}
              className="mt-3 px-4 py-2 bg-black text-white rounded flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Process File"
              )}
            </button>
          </div>
        )}

        {fileError && (
          <p className="mt-3 text-sm text-red-600">{fileError}</p>
        )}
      </main>
    </div>
  );
}
