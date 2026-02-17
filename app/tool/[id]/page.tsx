"use client";

import {
  ArrowLeft,
  Upload,
  Loader2,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  ArrowLeftRight,
  ScanText,
  Shield,
} from "lucide-react";

import { ToolCard } from "@/components/ToolCard";
import { PDF_TOOLS } from "@/lib/pdfTools";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { clearStoredFiles, storeFiles } from "@/lib/fileStore";

import {
  saveToolState,
  loadToolState,
  clearToolState,
} from "@/lib/toolStateStorage";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const UPLOAD_ENABLED_TOOLS = new Set([
  "ocr",
  "jpeg-to-pdf",
  "png-to-pdf",
  "pdf-protect",
  "pdf-compress",
  "pdf-watermark",
  "pdf-redact",
  "metadata-viewer",
  "pdf-extract-images",
  "pdf-delete-pages",
  "pdf-page-reorder",
  "pdf-password-remover",
  "pdf-page-numbers",
  "pdf-rotate",
]);

const CATEGORY_TOOLS = new Set(["pdf-tools", "file-conversion", "data-tools"]);
const FILE_CONVERSION_TOOLS = Object.freeze([
  {
    id: "document-to-pdf",
    title: "Document to PDF",
    description: "Convert TXT and DOCX documents to PDF",
    href: "/dashboard/document-to-pdf",
    icon: FileText,
  },
  {
    id: "jpeg-to-pdf",
    title: "JPEG to PDF",
    description: "Convert JPEG images into PDF",
    href: "/tool/jpeg-to-pdf",
    icon: ImageIcon,
  },
  {
    id: "png-to-pdf",
    title: "PNG to PDF",
    description: "Convert PNG images into PDF",
    href: "/tool/png-to-pdf",
    icon: ImageIcon,
  },
]);
const DATA_TOOLS = Object.freeze([
  {
    id: "ocr",
    title: "OCR",
    description: "Extract text from images",
    href: "/tool/ocr",
    icon: ScanText,
  },
  {
    id: "metadata-viewer",
    title: "Metadata Viewer",
    description: "Extract and download PDF metadata",
    href: "/tool/metadata-viewer",
    icon: FileText,
  },
  {
    id: "pdf-redact",
    title: "Redact PDF",
    description: "Flatten PDF pages to remove selectable text",
    href: "/tool/pdf-redact",
    icon: Shield,
  },
]);

const MOVED_TO_DASHBOARD: Record<string, string> = {
  "pdf-merge": "/dashboard/pdf-merge",
  "document-to-pdf": "/dashboard/document-to-pdf",
  "pdf-split": "/dashboard/pdf-split",
};

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

  const [watermarkText, setWatermarkText] = useState("");
  const [rotationAngle, setRotationAngle] = useState(45);
  const [opacity, setOpacity] = useState(40);
  const [compressionLevel, setCompressionLevel] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [compressionTargetBytesInput, setCompressionTargetBytesInput] =
    useState("");
  const [protectPassword, setProtectPassword] = useState("");
  const [passwordRemoverPassword, setPasswordRemoverPassword] = useState("");
  const [deletePagesInput, setDeletePagesInput] = useState("");
  const [reorderPagesInput, setReorderPagesInput] = useState("");
  const [extractImageFormat, setExtractImageFormat] = useState<"png" | "jpg">(
    "png",
  );
  const [redactionStrategy, setRedactionStrategy] =
    useState<"flatten">("flatten");

  const [rotateConfig, setRotateConfig] = useState({ angle: 90, pages: "" });
  const [pageNumberFormat, setPageNumberFormat] = useState("numeric");
  const [pageNumberFontSize, setPageNumberFontSize] = useState(14);

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
    if (!toolId || !selectedFiles.length) return;

    const file = selectedFiles[0];
    saveToolState(toolId, {
      fileMeta: { name: file.name, size: file.size, type: file.type },
    });
  }, [toolId, selectedFiles]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedWork) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedWork]);

  useEffect(() => {
    if (toolId !== "pdf-compress") return;

    const savedLevel = localStorage.getItem("compressionLevel");
    if (savedLevel === "low" || savedLevel === "medium" || savedLevel === "high") {
      setCompressionLevel(savedLevel);
    }

    const savedTarget =
      localStorage.getItem("compressionTargetBytes") ||
      localStorage.getItem("targetBytes") ||
      "";
    setCompressionTargetBytesInput(savedTarget);
  }, [toolId]);

  const getSupportedTypes = () => {
    switch (toolId) {
      case "ocr":
        return [".jpg", ".jpeg", ".png"];
      case "jpeg-to-pdf":
        return [".jpg", ".jpeg"];
      case "png-to-pdf":
        return [".png"];
      default:
        return [".pdf"];
    }
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="w-6 h-6 text-red-500" />;
    if (["jpg", "jpeg", "png"].includes(ext || ""))
      return <ImageIcon className="w-6 h-6 text-blue-500" />;
    return <FileText className="w-6 h-6 text-gray-400" />;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearStoredFiles();

    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const MAX_FILES = 10;
    if (files.length > MAX_FILES) {
      setFileError(`You can upload a maximum of ${MAX_FILES} files.`);
      return;
    }

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

  const handleProcessFile = async () => {
    if (!selectedFiles.length) return;
    if (toolId === "pdf-protect" && !protectPassword.trim())
      return setFileError("Enter password.");
    if (toolId === "pdf-password-remover" && !passwordRemoverPassword.trim())
      return setFileError("Enter password.");
    if (toolId === "pdf-compress") {
      localStorage.setItem("compressionLevel", compressionLevel);
      const parsedTarget = Number.parseInt(compressionTargetBytesInput.trim(), 10);
      if (Number.isFinite(parsedTarget) && parsedTarget > 0) {
        localStorage.setItem("compressionTargetBytes", String(parsedTarget));
        localStorage.setItem("targetBytes", String(parsedTarget));
      } else {
        localStorage.removeItem("compressionTargetBytes");
        localStorage.removeItem("targetBytes");
      }
    }

    setIsProcessing(true);

    try {
      const ok = await storeFiles(
        selectedFiles,
        toolId === "pdf-protect"
          ? { password: protectPassword }
          : toolId === "pdf-password-remover"
            ? { password: passwordRemoverPassword }
            : undefined,
      );

      if (!ok) return setFileError("Failed to process file.");

      clearToolState(toolId);
      router.push(`/tool/${toolId}/processing`);
    } catch {
      setFileError("Unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackNavigation = () => {
    if (hasUnsavedWork) {
      const confirmLeave = window.confirm(
        "You have unsaved work. Leave anyway?",
      );
      if (!confirmLeave) return;
    }
    router.push("/dashboard");
  };

  if (CATEGORY_TOOLS.has(toolId)) {
    const categoryConfig =
      toolId === "pdf-tools"
        ? {
            title: "PDF Tools",
            subtitle: "Choose a PDF tool",
            tools: PDF_TOOLS,
            icon: FileText,
          }
        : toolId === "file-conversion"
          ? {
              title: "File Conversion",
              subtitle: "Convert files across supported formats",
              tools: FILE_CONVERSION_TOOLS,
              icon: ArrowLeftRight,
            }
          : {
              title: "Data Tools",
              subtitle: "Extract and process document data",
              tools: DATA_TOOLS,
              icon: ScanText,
            };

    return (
      <div className="min-h-screen flex flex-col">
        <main className="container mx-auto px-6 py-12 md:px-12">
          <div className="flex items-center gap-3 mb-2">
            <categoryConfig.icon className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-semibold">{categoryConfig.title}</h1>
          </div>
          <p className="text-muted-foreground mb-12">
            {categoryConfig.subtitle}
          </p>

          <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
            {categoryConfig.tools.map((tool) => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const dashboardFallback = MOVED_TO_DASHBOARD[toolId];
  if (!UPLOAD_ENABLED_TOOLS.has(toolId)) {
    const heading = dashboardFallback
      ? "This tool moved to Dashboard"
      : "This tool is currently unavailable";
    const details = dashboardFallback
      ? "Use the dashboard route for this tool."
      : "Choose an available tool to continue.";

    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center border rounded-xl p-6">
          <h1 className="text-2xl font-semibold">{heading}</h1>
          <p className="text-muted-foreground mt-2">
            {details} (Tool ID: {toolId})
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {dashboardFallback && (
              <button
                onClick={() => router.push(dashboardFallback)}
                className="w-full py-3 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800"
              >
                Open Tool
              </button>
            )}
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
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
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-semibold mb-8">Upload your file</h1>

        <motion.div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-20 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50"
        >
          <Upload className="mx-auto mb-4" />
          <p>
            {selectedFiles.length
              ? `${selectedFiles.length} file(s) selected`
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

        <p className="text-sm text-gray-500 mt-2">Maximum 10 files allowed</p>

        {toolId === "pdf-compress" && (
          <div className="mt-6 rounded-xl border border-gray-200 p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Compression Level
              </label>
              <select
                value={compressionLevel}
                onChange={(e) =>
                  setCompressionLevel(e.target.value as "low" | "medium" | "high")
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="low">Low (higher quality)</option>
                <option value="medium">Medium</option>
                <option value="high">High (smaller size)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Size (bytes)
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={compressionTargetBytesInput}
                onChange={(e) => setCompressionTargetBytesInput(e.target.value)}
                placeholder="Optional, e.g. 500000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional. If set, we try to reach this size and report when not possible.
              </p>
            </div>
          </div>
        )}

        {fileError && <p className="mt-3 text-sm text-red-600">{fileError}</p>}

        <button
          onClick={handleProcessFile}
          disabled={
            !selectedFiles.length ||
            isProcessing ||
            (toolId === "pdf-protect" && !protectPassword.trim()) ||
            (toolId === "pdf-password-remover" &&
              !passwordRemoverPassword.trim())
          }
          className={`mt-8 w-full py-3 rounded-lg text-sm font-medium transition ${
            selectedFiles.length && !isProcessing
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isProcessing ? "Processing..." : "Process File"}
        </button>
      </main>
    </div>
  );
}
