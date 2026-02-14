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

import { storeFile } from "@/lib/fileStore";
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasUnsavedWork, setHasUnsavedWork] = useState(false);

  /* ✅ Watermark States */
  const [watermarkText, setWatermarkText] = useState("");
  const [rotationAngle, setRotationAngle] = useState(45);

  /* ✅ Opacity State */
  const [opacity, setOpacity] = useState(40);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [persistedFileMeta, setPersistedFileMeta] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

  useEffect(() => {
    if (!toolId) return;
    const stored = loadToolState(toolId);
    if (stored?.fileMeta) setPersistedFileMeta(stored.fileMeta);
  }, [toolId]);

  useEffect(() => {
    if (!toolId || !selectedFile) return;

    saveToolState(toolId, {
      fileMeta: {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      },
    });
  }, [toolId, selectedFile]);

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
      case "pdf-compress":
      case "pdf-watermark":
        return [".pdf"];
      default:
        return [];
    }
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "pdf") {
      return <FileText className="w-6 h-6 text-red-500" />;
    }

    if (["jpg", "jpeg", "png"].includes(ext || "")) {
      return <ImageIcon className="w-6 h-6 text-blue-500" />;
    }

    return <FileText className="w-6 h-6 text-gray-400" />;
  };

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
      setFileError("File too large. Max size is 10MB.");
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    setHasUnsavedWork(true);
  };

  const handleRemoveFile = () => {
    const confirmed = window.confirm(
      "This will remove your uploaded file. Continue?"
    );
    if (!confirmed) return;

    setSelectedFile(null);
    setPersistedFileMeta(null);
    setFileError(null);
    clearToolState(toolId);
    setHasUnsavedWork(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReplaceFile = () => {
    fileInputRef.current?.click();
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    try {
      const ok = await storeFile(selectedFile);

      if (ok) {
        if (toolId === "pdf-watermark") {
          localStorage.setItem("watermarkRotation", rotationAngle.toString());
          localStorage.setItem("watermarkText", watermarkText);
          localStorage.setItem("watermarkOpacity", opacity.toString());
        }

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

  const handleBackNavigation = () => {
    if (hasUnsavedWork) {
      const confirmLeave = window.confirm(
        "You have unsaved work. Leave anyway?"
      );
      if (!confirmLeave) return;
    }
    router.push("/dashboard");
  };

  if (toolId === "pdf-tools") {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="container mx-auto px-6 py-12 md:px-12">
          <h1 className="text-3xl font-semibold mb-2">PDF Tools</h1>
          <p className="text-muted-foreground mb-12">Choose a PDF tool</p>

          <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
            {PDF_TOOLS.map((tool) => (
              <ToolCard
                key={tool.id}
                icon={tool.icon}
                title={tool.title}
                description={tool.description}
                href={tool.href}
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

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
          <div className="mt-6 flex items-center gap-3 p-4 rounded-xl border bg-white shadow-sm hover:bg-gray-50 hover:border-gray-300">
            {getFileIcon(selectedFile)}

            <div className="flex-1">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <button
              onClick={handleReplaceFile}
              className="text-sm text-blue-600 hover:underline"
            >
              Replace
            </button>

            <button
              onClick={handleRemoveFile}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        )}

        {/* Watermark Text */}
        {toolId === "pdf-watermark" && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Watermark Text
            </label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Enter watermark text (e.g., Confidential)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Rotation */}
        {toolId === "pdf-watermark" && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Watermark Rotation
            </label>
            <select
              value={rotationAngle}
              onChange={(e) => setRotationAngle(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={0}>0°</option>
              <option value={45}>45°</option>
              <option value={90}>90°</option>
            </select>
          </div>
        )}

        {/* Opacity */}
        {toolId === "pdf-watermark" && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Watermark Opacity ({opacity}%)
            </label>

            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        <button
          onClick={handleProcessFile}
          disabled={!selectedFile || isProcessing}
          className={`mt-8 w-full py-3 rounded-lg text-sm font-medium transition ${
            selectedFile && !isProcessing
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
