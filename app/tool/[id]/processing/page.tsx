"use client";

import { Loader2, Lock, CheckCircle, AlertCircle, Download, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Tesseract from "tesseract.js";
import { getStoredFile, clearStoredFile } from "@/lib/fileStore";
import { PDFDocument } from "pdf-lib";

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
  const storedFile = getStoredFile();

  if (!storedFile) {
    router.push(`/tool/${toolId}`);
    return;
  }

  const fileData = storedFile.data;

  // ✅ FIX: handle pdf-redact as well
  if (toolId === "ocr") {
  runOCR(fileData);
}
else if (toolId === "pdf-compress") {
  startCompressFlow(fileData);
}
else if (toolId === "pdf-redact") {
  setStatus("done");
  clearStoredFile();
}
else {
  setStatus("done");
  clearStoredFile();
}

}, [toolId]);

const startCompressFlow = async (base64Data: string) => {
  setStatus("processing");
  setProgress(20);

  try {
    const targetSize =
  localStorage.getItem("targetSize") || "1MB";

let targetBytes = 0;
let targetDisplay = "";

if (targetSize.includes("KB")) {
  const kb = Number(targetSize.replace("KB", ""));
  targetBytes = kb * 1024;
  targetDisplay = `${kb} KB`;
} else {
  const mb = Number(targetSize.replace("MB", ""));
  targetBytes = mb * 1024 * 1024;
  targetDisplay = `${mb} MB`;
}

localStorage.setItem("targetDisplay", targetDisplay);

const res = await fetch("/api/compress", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    base64: base64Data,
    targetBytes,
  }),
});


    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Compression failed");
    }

    // Save result to localStorage
    localStorage.setItem("originalMB", data.original);
    localStorage.setItem("compressedMB", data.compressed);
    localStorage.setItem("reduction", data.reduction);

    const blob = new Blob(
      [Uint8Array.from(atob(data.file), c => c.charCodeAt(0))],
      { type: "application/pdf" }
    );

    const url = URL.createObjectURL(blob);
    localStorage.setItem("compressedPDF", url);

    setProgress(100);
    setStatus("done");
    clearStoredFile();

  } catch (err) {
    console.error("Compression failed:", err);
    setStatus("error");
    setErrorMessage("Failed to compress PDF.");
  }
};




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
              {toolId === "pdf-compress"
                ? "PDF Compressed Successfully!"
                : "Text Extracted Successfully!"}
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

            {toolId === "pdf-compress" ? (
            <button
  onClick={() => {
  const url = localStorage.getItem("compressedPDF");
  if (url) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "compressed.pdf";
    a.click();
  }
}}

  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
>

            <Download className="w-4 h-4" />
              Download PDF
            </button>
            ) : (
            <button
              onClick={handleDownloadText}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
            <Download className="w-4 h-4" />
               Download .txt
            </button>
          )}

          </div>

{toolId === "pdf-compress" ? (
  <div className="bg-white rounded-xl border p-6 shadow-sm">

    <h3 className="font-medium mb-4">Compression Result</h3>

    <div className="space-y-2 text-sm">
      <p>
        <strong>Original Size:</strong>{" "}
        {localStorage.getItem("originalMB")} MB
      </p>

      <p>
        <strong>Compressed Size:</strong>{" "}
        {localStorage.getItem("compressedMB")} MB
      </p>

      <p>
        <strong>Reduction:</strong>{" "}
        {localStorage.getItem("reduction")}% smaller
      </p>
    </div>

  </div>
) : (
  <div className="bg-white rounded-xl border p-6 shadow-sm">
    <h3 className="font-medium mb-3">Extracted Text:</h3>
    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
      <pre className="whitespace-pre-wrap text-sm font-mono">
        {extractedText || "(No text detected)"}
      </pre>
    </div>
  </div>
)}


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
