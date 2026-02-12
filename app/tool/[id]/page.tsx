"use client";

import {
  ArrowLeft,
  Upload,
  Loader2,
  FileText,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

import { ToolCard } from "@/components/ToolCard";
import { PDF_TOOLS } from "@/lib/pdfTools"; // ✅ LOCKED SOURCE
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasUnsavedWork, setHasUnsavedWork] = useState(false);
  const [password, setPassword] = useState("");
  const [compressionLevel, setCompressionLevel] = useState<
    "low" | "medium" | "high"
  >("medium");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [persistedFileMeta, setPersistedFileMeta] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

  /* ---------------- Restore persisted state ---------------- */
  useEffect(() => {
    if (!toolId) return;
    const stored = loadToolState(toolId);
    if (stored?.fileMeta) setPersistedFileMeta(stored.fileMeta);
  }, [toolId]);

  /* ---------------- Persist state ---------------- */
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

  /* ---------------- Warn before refresh ---------------- */
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

  /* ---------------- Supported Types ---------------- */
  const getSupportedTypes = () => {
    switch (toolId) {
      case "ocr":
        return [".jpg", ".jpeg", ".png"];
      case "pdf-merge":
      case "pdf-split":
      case "pdf-protect":
      case "pdf-compress":
      case "pdf-redact":
        return [".pdf"];
      default:
        return [];
    }
  };

  /* ---------------- File Icon Logic (NEW FEATURE) ---------------- */
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

  /* ---------------- Handle File Select ---------------- */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = getSupportedTypes();
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (allowed.length && !allowed.includes(ext)) {
      setFileError(`Un
