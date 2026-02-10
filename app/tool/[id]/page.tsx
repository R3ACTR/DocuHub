"use client";

import {
  ArrowLeft,
  Upload,
  Combine,
  Scissors,
  FileUp,
  Loader2,
  FileText   // ← ADD THIS
} from "lucide-react";


import { ToolCard } from "@/components/ToolCard";
import { HelpTooltip } from "@/components/HelpTooltip";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { storeFile } from "@/lib/fileStore";

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

  /* --------------------------------------------
     Remember last-used tool
  --------------------------------------------- */
  useEffect(() => {
    if (toolId && toolId !== "pdf-tools") {
      localStorage.setItem("lastUsedTool", toolId);
      localStorage.removeItem("hideResume");
    }
  }, [toolId]);

  /* --------------------------------------------
     Warn before refresh / tab close
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = getSupportedTypes();
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (allowed.length && !allowed.includes(ext)) {
      setFileError(`Unsupported file type. Allowed: ${allowed.join(", ")}`);
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`
      );
      e.target.value = "";
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    setHasUnsavedWork(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const allowed = getSupportedTypes();
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (allowed.length && !allowed.includes(ext)) {
      setFileError(`Unsupported file type. Allowed: ${allowed.join(", ")}`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`
      );
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    setHasUnsavedWork(true);
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const ok = await storeFile(selectedFile);
      if (ok) router.push(`/tool/${toolId}/processing`);
      else setFileError("Failed to process file.");
    } catch {
      setFileError("Unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackNavigation = () => {
    if (hasUnsavedWork) {
      const confirmLeave = window.confirm(
        "You have unsaved work. Are you sure you want to leave?"
      );
      if (!confirmLeave) return;
    }
    router.push("/dashboard");
  };

  /* --------------------------------------------
     PDF TOOLS PAGE
  --------------------------------------------- */
  if (toolId === "pdf-tools") {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="container mx-auto px-6 py-12 md:px-12">
          <h1 className="flex items-center text-3xl font-semibold mb-2">
            PDF Tools
            <HelpTooltip text="Merge, split, protect PDFs. All processing happens locally in your browser." />
          </h1>
          <p className="text-muted-foreground mb-12">
            Choose a PDF tool
          </p>

          <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
<ToolCard
  icon={Combine}
  title="Merge PDF"
  description="Combine multiple PDFs"
  href="/dashboard/pdf-merge"
/>

<ToolCard
  icon={Scissors}
  title="Split PDF"
  description="Split PDF pages"
  href="/dashboard/pdf-split"
/>

<ToolCard
  icon={FileText}
  title="Redact PDF"
  description="Securely hide sensitive information in PDF"
  href="/tool/pdf-redact"
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
     GENERIC UPLOAD PAGE
  --------------------------------------------- */
  return (
    <div className="min-h-screen flex flex-col">
      <main className="container mx-auto px-6 py-12 md:px-12">
        <button
          onClick={handleBackNavigation}
          className="inline-flex items-center gap-2 text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <h1 className="flex items-center text-3xl font-semibold mb-8">
          Upload your file
          <HelpTooltip text="Files are processed locally. Nothing is uploaded to a server." />
        </h1>

        <motion.div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-20 text-center cursor-pointer ${
            isDraggingOver ? "border-blue-500 bg-blue-50" : "hover:border-gray-400"
          }`}
        >
          <Upload className="mx-auto mb-4" />
          <p>Drag & drop or click to browse</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={getSupportedTypes().join(",")}
            onChange={handleFile}
          />
        </motion.div>

        {selectedFile && (
          <div className="mt-4">
            <p className="font-medium">{selectedFile.name}</p>
            <button
              onClick={handleProcessFile}
              disabled={isProcessing}
              className="mt-3 px-4 py-2 bg-black text-white rounded flex items-center gap-2"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : "Process File"}
            </button>
          </div>
        )}

        {fileError && <p className="mt-3 text-sm text-red-600">{fileError}</p>}
      </main>
    </div>
  );
}
