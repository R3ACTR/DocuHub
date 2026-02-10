"use client";

import { Loader2, Lock, CheckCircle, AlertCircle, Download, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Tesseract from "tesseract.js";
import { getStoredFile, clearStoredFile } from "@/lib/fileStore";

export default function ProcessingPage() {
  const router = useRouter();
  const params = useParams();
  const toolId = params.id as string;

  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get file from sessionStorage (set by upload page)
    const storedFile = getStoredFile();
    if (!storedFile) {
      router.push(`/tool/${toolId}`);
      return;
    }
    const fileData = storedFile.data;

    if (toolId === "ocr") {
      runOCR(fileData);
    }
  }, [toolId]);

  const runOCR = async (base64Data: string) => {
    setStatus("processing");
    setProgress(0);

    try {
      const result = await Tesseract.recognize(base64Data, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      setExtractedText(result.data.text);
      setStatus("done");

      // Clear stored file
      clearStoredFile();
    } catch (err) {
      console.error("OCR Error:", err);
      setStatus("error");
      setErrorMessage("Failed to extract text from image.");
    }
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extracted-text.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Processing state
  if (status === "processing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#eef6f5]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-[#1e1e2e] mb-2">
            Extracting text from image...
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            This may take a few seconds
          </p>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-sm text-gray-600 mb-8">{progress}% complete</p>

          <div className="flex justify-center mb-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#1e1e2e]" />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>All processing happens locally in your browser.</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#eef6f5]">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-[#1e1e2e] mb-2">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>

          <button
            onClick={() => router.push(`/tool/${toolId}`)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Done state - show results
  if (status === "done") {
    return (
      <div className="min-h-screen bg-[#eef6f5] py-12">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-[#1e1e2e] mb-2">
              Text Extracted Successfully!
            </h2>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Copy Text"}
            </button>

            <button
              onClick={handleDownloadText}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Download className="w-4 h-4" />
              Download .txt
            </button>
          </div>

          {/* Extracted text */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="font-medium mb-3">Extracted Text:</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {extractedText || "(No text detected)"}
              </pre>
            </div>
          </div>

          {/* Back button */}
          <div className="text-center mt-8">
            <button
              onClick={() => router.push(`/tool/${toolId}`)}
              className="text-indigo-600 hover:underline"
            >
              ← Process another image
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Idle / loading state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#eef6f5]">
      <Loader2 className="h-8 w-8 animate-spin text-[#1e1e2e]" />
    </div>
  );
}
