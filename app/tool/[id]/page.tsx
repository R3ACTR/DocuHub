"use client";

import {
  ArrowLeft,
  Upload,
  Loader2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

import { ToolCard } from "@/components/ToolCard";
import { PDF_TOOLS } from "@/lib/pdfTools";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { clearStoredFiles, storeFile } from "@/lib/fileStore";

import {
  saveToolState,
  loadToolState,
  clearToolState,
} from "@/lib/toolStateStorage";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ToolUploadPage() {
  const router = useRouter();
  const params = useParams();

  const toolId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasUnsavedWork, setHasUnsavedWork] = useState(false);

  /* Watermark */
  const [watermarkText, setWatermarkText] = useState("");
  const [rotationAngle, setRotationAngle] = useState(45);
  const [opacity, setOpacity] = useState(40);

  /* Page Numbers */
  const [pageNumberFormat, setPageNumberFormat] = useState("numeric");
  const [pageNumberFontSize, setPageNumberFontSize] = useState(14);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [persistedFileMeta, setPersistedFileMeta] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

  /* Load saved state */
  useEffect(() => {
    if (!toolId) return;
    const stored = loadToolState(toolId);
    if (stored?.fileMeta) setPersistedFileMeta(stored.fileMeta);
  }, [toolId]);

  /* Save state */
  useEffect(() => {
    if (!toolId || !selectedFiles.length) return;

    const file = selectedFiles[0];

    saveToolState(toolId, {
      fileMeta: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
    });
  }, [toolId, selectedFiles]);

  /* Leave warning */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedWork) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedWork]);

  /* Supported types */
  const getSupportedTypes = () => {
    switch (toolId) {
      case "ocr":
        return [".jpg", ".jpeg", ".png"];

      case "jpeg-to-pdf":
        return [".jpg", ".jpeg"];

      case "png-to-pdf":
        return [".png"];

      case "pdf-merge":
      case "pdf-split":
      case "pdf-protect":
      case "pdf-compress":
      case "pdf-watermark":
      case "pdf-page-numbers":
        return [".pdf"];

      default:
        return [];
    }
  };

  /* File icon */
  const getFileIcon = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "pdf")
      return <FileText className="w-6 h-6 text-red-500" />;

    if (["jpg", "jpeg", "png"].includes(ext || ""))
      return <ImageIcon className="w-6 h-6 text-blue-500" />;

    return <FileText className="w-6 h-6 text-gray-400" />;
  };

  /* File select */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearStoredFiles();

    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const allowed = getSupportedTypes();
    const validFiles: File[] = [];

    for (const file of files) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();

      if (allowed.length && !allowed.includes(ext)) {
        setFileError(`Unsupported file type: ${file.name}`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File too large: ${file.name}`);
        return;
      }

      validFiles.push(file);
    }

    setFileError(null);
    setSelectedFiles(validFiles);
    setHasUnsavedWork(true);
  };

  /* Remove file */
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  /* Replace */
  const handleReplaceFile = () => {
    fileInputRef.current?.click();
  };

  /* Process */
  const handleProcessFile = async () => {
    if (!selectedFiles.length) return;

    setIsProcessing(true);

    try {
      let ok = true;

      for (const file of selectedFiles) {
        const res = await storeFile(file);
        if (!res) {
          ok = false;
          break;
        }
      }

      if (!ok) {
        setFileError("Failed to process file.");
        return;
      }

      if (toolId === "pdf-watermark") {
        localStorage.setItem("watermarkRotation", rotationAngle.toString());
        localStorage.setItem("watermarkText", watermarkText);
        localStorage.setItem("watermarkOpacity", opacity.toString());
      }

      if (toolId === "pdf-page-numbers") {
        localStorage.setItem("pageNumberFormat", pageNumberFormat);
        localStorage.setItem("pageNumberFontSize", pageNumberFontSize.toString());
      }

      clearToolState(toolId);
      router.push(`/tool/${toolId}/processing`);
    } catch {
      setFileError("Unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  /* Back */
  const handleBackNavigation = () => {
    if (hasUnsavedWork) {
      const confirmLeave = window.confirm(
        "You have unsaved work. Leave anyway?"
      );
      if (!confirmLeave) return;
    }
    router.push("/dashboard");
  };

  /* PDF tools page */
  if (toolId === "pdf-tools") {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="container mx-auto px-6 py-12 md:px-12">
          <h1 className="text-3xl font-semibold mb-2">PDF Tools</h1>
          <p className="text-muted-foreground mb-12">Choose a PDF tool</p>

          <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
            {PDF_TOOLS.map(tool => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  /* UI */
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

        <h1 className="text-3xl font-semibold mb-8">Upload your file</h1>

        <motion.div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => {
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
            {selectedFiles.length
              ? `${selectedFiles.length} file(s) selected`
              : persistedFileMeta
              ? `Previously selected: ${persistedFileMeta.name}`
              : "Drag & drop or click to browse"}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept={getSupportedTypes().join(",")}
            onChange={handleFile}
          />
        </motion.div>

        {/* File list */}
        {selectedFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl border bg-white shadow-sm"
              >
                {getFileIcon(file)}

                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Watermark */}
        {toolId === "pdf-watermark" && (
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">
              Watermark Text
            </label>

            <input
              type="text"
              value={watermarkText}
              onChange={e => setWatermarkText(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        )}

        {/* Page Numbers */}
        {toolId === "pdf-page-numbers" && (
          <>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                Page Number Format
              </label>

              <select
                value={pageNumberFormat}
                onChange={e => setPageNumberFormat(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="numeric">1,2,3</option>
                <option value="roman">i,ii,iii</option>
                <option value="alphabet">A,B,C</option>
              </select>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                Font Size ({pageNumberFontSize}px)
              </label>

              <input
                type="range"
                min={8}
                max={48}
                value={pageNumberFontSize}
                onChange={e => setPageNumberFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* Button */}
        <button
          onClick={handleProcessFile}
          disabled={!selectedFiles.length || isProcessing}
          className={`mt-8 w-full py-3 rounded-lg text-sm font-medium transition ${
            selectedFiles.length && !isProcessing
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : (
            "Process File"
          )}
        </button>

        {fileError && (
          <p className="mt-3 text-sm text-red-600">{fileError}</p>
        )}
      </main>
    </div>
  );
}
