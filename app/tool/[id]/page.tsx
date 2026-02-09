"use client";

import { ArrowLeft, Upload, Combine, Scissors, FileUp } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function ToolUploadPage() {
  const router = useRouter();
  const params = useParams();

  const toolId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [hasUnsavedWork, setHasUnsavedWork] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
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
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
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

    setFileError(null);
    setSelectedFile(file);
    setHasUnsavedWork(true);

    setTimeout(() => {
      router.push(`/tool/${toolId}/processing`);
    }, 500);
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
     PDF TOOLS LANDING PAGE
  --------------------------------------------- */
  if (toolId === "pdf-tools") {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-6 py-12 md:px-12">
          <h1 className="text-3xl font-semibold mb-2">PDF Tools</h1>
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
      <main className="flex-1 container mx-auto px-6 py-12 md:px-12">
        <button
          onClick={handleBackNavigation}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-semibold mb-12">
          Upload your file
        </h1>

        <div className="w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full rounded-2xl border-2 border-dashed bg-[#eef6f5]"
          >
            <label className="flex flex-col items-center justify-center h-[400px] cursor-pointer">
              <Upload className="w-16 h-16 mb-4" />
              <p className="text-xl font-medium">
                Drag & drop your file here
              </p>
              <p className="text-muted-foreground">
                or click to browse
              </p>
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFile}
              />
            </label>
          </motion.div>

          {fileError && (
            <p className="mt-3 text-sm text-red-600">{fileError}</p>
          )}

          <div className="flex justify-between text-xs text-muted-foreground mt-4">
            <span>
              Supported formats:{" "}
              {getSupportedTypes().length
                ? getSupportedTypes().join(", ")
                : "—"}
            </span>
            <span>Max file size: 10MB</span>
          </div>
        </div>
      </main>
    </div>
  );
}
