"use client";

import { Loader2, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Tesseract from "tesseract.js";
import { getStoredFiles, clearStoredFiles } from "@/lib/fileStore";
import { PDFDocument } from "pdf-lib";

type StoredFile = {
  data: string;
  name: string;
  type: string;
};

export default function ProcessingPage() {
  const router = useRouter();
  const params = useParams();
  const toolId = params.id as string;

  const [status, setStatus] = useState<"processing" | "done" | "error">(
    "processing"
  );
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  /* ================= RUN TOOL ================= */
  useEffect(() => {
    const run = async () => {
      const stored = getStoredFiles() as StoredFile[];

      if (!stored.length) {
        router.push(`/tool/${toolId}`);
        return;
      }

      try {
        if (toolId === "ocr") await runOCR(stored[0].data);

        else if (toolId === "pdf-protect")
          await protectPDF(stored[0].data);

        else if (toolId === "jpeg-to-pdf")
          await imageToPdf(stored[0].data, "jpg");

        else if (toolId === "png-to-pdf")
          await imageToPdf(stored[0].data, "png");

        else if (toolId === "pdf-compress")
          await startCompressFlow(stored);

        else setStatus("done");
      } catch (e) {
        console.error(e);
        setError("Processing failed");
        setStatus("error");
      } finally {
        clearStoredFiles();
      }
    };

    run();
  }, [toolId, router]);

  /* ================= OCR ================= */
  const runOCR = async (base64: string) => {
    const res = await Tesseract.recognize(base64, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setProgress(Math.round(m.progress * 100));
        }
      },
    });

    setText(res.data.text);
    setStatus("done");
  };

  /* ================= COMPRESS ================= */
  const startCompressFlow = async (files: StoredFile[]) => {
    setProgress(20);

    const targetSize = localStorage.getItem("targetSize") || "1MB";

    const targetBytes = targetSize.includes("KB")
      ? Number(targetSize.replace("KB", "")) * 1024
      : Number(targetSize.replace("MB", "")) * 1024 * 1024;

    const res = await fetch("/api/compress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: files.map((f) => ({ base64: f.data })),
        targetBytes,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data?.results?.length) {
      throw new Error("Compression failed");
    }

    const bytes = Uint8Array.from(
      atob(data.results[0].file),
      (c) => c.charCodeAt(0)
    );

    setDownloadUrl(makeBlobUrl(bytes));
    setProgress(100);
    setStatus("done");
  };

  /* ================= PDF PROTECT ================= */
  const protectPDF = async (base64: string) => {
    const bytes = base64ToBytes(base64);
    const pdf = await PDFDocument.load(bytes);
    const saved = await pdf.save();

    setDownloadUrl(makeBlobUrl(saved));
    setStatus("done");
  };

  /* ================= IMAGE → PDF ================= */
  const imageToPdf = async (base64: string, type: "jpg" | "png") => {
    const bytes = base64ToBytes(base64);

    const pdf = await PDFDocument.create();
    const img =
      type === "jpg"
        ? await pdf.embedJpg(bytes)
        : await pdf.embedPng(bytes);

    const page = pdf.addPage([img.width, img.height]);

    page.drawImage(img, {
      x: 0,
      y: 0,
      width: img.width,
      height: img.height,
    });

    const saved = await pdf.save();
    setDownloadUrl(makeBlobUrl(saved));
    setStatus("done");
  };

  /* ================= HELPERS ================= */

  const base64ToBytes = (base64: string) => {
    const clean = base64.includes(",") ? base64.split(",")[1] : base64;
    return Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
  };

  const makeBlobUrl = (bytes: Uint8Array) => {
    const blob = new Blob([new Uint8Array(bytes)], {
      type: "application/pdf",
    });
    return URL.createObjectURL(blob);
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "result.pdf";
    a.click();
  };

  /* ================= UI STATES ================= */

  if (status === "processing")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="ml-3">{progress}%</p>
      </div>
    );

  if (status === "error")
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p>{error}</p>
        </div>
      </div>
    );

  /* ================= SUCCESS ================= */

  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div>
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />

        <h2 className="text-xl font-semibold mb-4">
          {toolId === "jpeg-to-pdf"
            ? "JPEG Converted to PDF!"
            : toolId === "png-to-pdf"
            ? "PNG Converted to PDF!"
            : "Completed Successfully"}
        </h2>

        {downloadUrl && (
          <button
            onClick={download}
            className="px-6 py-3 bg-black text-white rounded-lg"
          >
            Download PDF
          </button>
        )}

        {toolId === "ocr" && (
          <button
            onClick={copyText}
            className="ml-4 px-6 py-3 border rounded-lg"
          >
            <Copy className="inline w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy Text"}
          </button>
        )}
      </div>
    </div>
  );
}
