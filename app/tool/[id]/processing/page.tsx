"use client";

import { Loader2, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Tesseract from "tesseract.js";
import { getStoredFiles, clearStoredFiles } from "@/lib/fileStore";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { protectPdfBytes } from "@/lib/pdfProtection";

type StoredFile = {
  data: string;
  name: string;
  type: string;
  file?: File;
  password?: string;
};

const SUPPORTED_PROCESSING_TOOLS = new Set([
  "ocr",
  "pdf-protect",
  "jpeg-to-pdf",
  "png-to-pdf",
  "pdf-watermark",
  "pdf-compress",
  "pdf-page-numbers",
  "pdf-rotate",
]);

export default function ProcessingPage() {
  const router = useRouter();
  const params = useParams();
  const toolId = params.id as string;

  const [status, setStatus] = useState<"processing" | "done" | "error">("processing");
  const [stage, setStage] = useState("Initializing...");
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [downloadUrls, setDownloadUrls] = useState<string[]>([]);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      downloadUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [downloadUrls]);

  useEffect(() => {
    const run = async () => {
      const stored = getStoredFiles() as StoredFile[];

      if (!SUPPORTED_PROCESSING_TOOLS.has(toolId)) {
        setError(`Unsupported tool "${toolId}". Please choose an available tool from the dashboard.`);
        setStatus("error");
        return;
      }

      if (!stored?.length) {
        router.push(`/tool/${toolId}`);
        return;
      }

      try {
        if (toolId === "ocr") {
          await runOCR(stored[0].data);
        } else if (toolId === "pdf-protect") {
          await protectPDF(stored);
        } else if (toolId === "jpeg-to-pdf") {
          await imageToPdf(stored, "jpg");
        } else if (toolId === "png-to-pdf") {
          await imageToPdf(stored, "png");
        } else if (toolId === "pdf-watermark") {
          await watermarkPDF(stored);
        } else if (toolId === "pdf-compress") {
          const sourceBytes = await readPdfBytes(stored[0]);
          setOriginalSize(sourceBytes.length);
          await compressPdf(stored[0], sourceBytes);
        } else if (toolId === "pdf-page-numbers") {
          await addPageNumbers(stored[0]);
        } else if (toolId === "pdf-rotate") {
          await rotatePDF(stored);
        }
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Processing failed");
        setStatus("error");
      } finally {
        clearStoredFiles();
      }
    };

    run();
  }, [toolId, router]);

  const runOCR = async (source: string) => {
    const res = await Tesseract.recognize(source, "eng", {
      logger: (m) => {
        if (m.status === "loading tesseract core") {
          setStage("Loading OCR engine...");
        }
        if (m.status === "recognizing text") {
          setStage("Recognizing text...");
          setProgress(Math.round(m.progress * 100));
        }
      },
    });

    setStage("Finalizing...");
    setText(res.data.text);
    setProgress(100);
    setStatus("done");
  };

  const compressPdf = async (file: StoredFile, sourceBytes: Uint8Array) => {
    setStage("Preparing file...");
    setProgress(20);

    const structuralSource = new Uint8Array(sourceBytes);
    structuralSource.set(sourceBytes);

    const level = getCompressionLevelFromState();
    setStage(`Compressing PDF (${level})...`);
    setProgress(45);

    const compressed =
      level === "low"
        ? await structuralCompressPdf(structuralSource)
        : await rasterCompressPdf(file, new Uint8Array(sourceBytes), level);

    const finalBytes =
      compressed.length < sourceBytes.length
        ? compressed
        : await structuralCompressPdf(structuralSource);

    setStage("Finalizing...");
    setProgress(85);
    setCompressedSize(finalBytes.length);
    setDownloadUrls([makeBlobUrl(finalBytes)]);
    setProgress(100);
    setStatus("done");
  };

  const watermarkPDF = async (files: StoredFile[]) => {
    const textValue = localStorage.getItem("watermarkText") || "";
    const rotation = Number(localStorage.getItem("watermarkRotation") || 45);
    const opacity = Number(localStorage.getItem("watermarkOpacity") || 40) / 100;
    const urls: string[] = [];

    for (const file of files) {
      const bytes = await readPdfBytes(file);
      const pdf = await PDFDocument.load(bytes);
      const pages = pdf.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText(textValue, {
          x: width / 3,
          y: height / 2,
          size: 50,
          rotate: degrees(rotation),
          color: rgb(0.75, 0.75, 0.75),
          opacity,
        });
      });

      urls.push(makeBlobUrl(await pdf.save()));
    }

    setDownloadUrls(urls);
    setStatus("done");
  };

  const protectPDF = async (files: StoredFile[]) => {
    const urls: string[] = [];

    for (const f of files) {
      if (!f.password?.trim()) {
        throw new Error("Password is required to protect PDF.");
      }

      const bytes = await readRawBytes(f);
      const encrypted = await protectPdfBytes(bytes, f.password);
      urls.push(makeBlobUrl(new Uint8Array(encrypted)));
    }

    setDownloadUrls(urls);
    setStatus("done");
  };

  const imageToPdf = async (files: StoredFile[], type: "jpg" | "png") => {
    const urls: string[] = [];

    for (const file of files) {
      const bytes = await readRawBytes(file);
      const pdf = await PDFDocument.create();
      const image = type === "jpg" ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
      const page = pdf.addPage([image.width, image.height]);

      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });

      urls.push(makeBlobUrl(await pdf.save()));
    }

    setDownloadUrls(urls);
    setStatus("done");
  };

  const addPageNumbers = async (file: StoredFile) => {
    const bytes = await readPdfBytes(file);
    const pdfDoc = await PDFDocument.load(bytes);
    const pages = pdfDoc.getPages();

    const format = localStorage.getItem("pageNumberFormat") || "numeric";
    const fontSize = parseInt(localStorage.getItem("pageNumberFontSize") || "14", 10);
    const font = await pdfDoc.embedFont("Helvetica");

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width } = page.getSize();

      let label = String(i + 1);
      if (format === "Roman") label = toRoman(i + 1);
      if (format === "letter") label = toLetter(i + 1);

      page.drawText(label, {
        x: width / 2 - 10,
        y: 20,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    setDownloadUrls([makeBlobUrl(await pdfDoc.save())]);
    setStatus("done");
  };

  const rotatePDF = async (files: StoredFile[]) => {
    const rawConfig = localStorage.getItem("pdfRotateConfig");
    let angle = 90;
    let pages = "";

    if (rawConfig) {
      try {
        const parsed = JSON.parse(rawConfig) as { angle?: number; pages?: string };
        if (typeof parsed.angle === "number") angle = parsed.angle;
        if (typeof parsed.pages === "string") pages = parsed.pages;
      } catch {
        // Keep defaults when config is invalid.
      }
    }

    const urls: string[] = [];

    for (const file of files) {
      const bytes = await readPdfBytes(file);
      const pdf = await PDFDocument.load(bytes);
      const docPages = pdf.getPages();
      const targets = parsePageSelection(pages, docPages.length);

      docPages.forEach((page, index) => {
        if (!targets.has(index + 1)) return;
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + angle) % 360));
      });

      urls.push(makeBlobUrl(await pdf.save()));
    }

    setDownloadUrls(urls);
    setStatus("done");
  };

  const structuralCompressPdf = async (bytes: Uint8Array) => {
    const sourcePdf = await PDFDocument.load(bytes);
    const outputPdf = await PDFDocument.create();
    const pages = await outputPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    pages.forEach((page) => outputPdf.addPage(page));

    return outputPdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 20,
    });
  };

  const rasterCompressPdf = async (
    file: StoredFile,
    bytes: Uint8Array,
    level: "medium" | "high"
  ) => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();

    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      disableAutoFetch: true,
      disableStream: true,
      filename: file.name,
    });

    const inputPdf = await loadingTask.promise;
    const outputPdf = await PDFDocument.create();
    const renderScale = level === "high" ? 1.0 : 1.25;
    const jpegQuality = level === "high" ? 0.55 : 0.72;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Canvas context is unavailable.");
    }

    for (let pageNumber = 1; pageNumber <= inputPdf.numPages; pageNumber++) {
      setStage(`Compressing page ${pageNumber}/${inputPdf.numPages}...`);
      setProgress(45 + Math.round((pageNumber / inputPdf.numPages) * 35));

      const page = await inputPdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const renderViewport = page.getViewport({ scale: renderScale });

      canvas.width = Math.max(1, Math.floor(renderViewport.width));
      canvas.height = Math.max(1, Math.floor(renderViewport.height));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport: renderViewport,
      }).promise;

      const jpegBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Image encoding failed"))),
          "image/jpeg",
          jpegQuality
        );
      });

      const jpgBytes = new Uint8Array(await jpegBlob.arrayBuffer());
      const image = await outputPdf.embedJpg(jpgBytes);
      const outPage = outputPdf.addPage([baseViewport.width, baseViewport.height]);
      outPage.drawImage(image, {
        x: 0,
        y: 0,
        width: baseViewport.width,
        height: baseViewport.height,
      });
    }

    canvas.width = 0;
    canvas.height = 0;
    await loadingTask.destroy();

    return outputPdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 20,
    });
  };

  const readPdfBytes = async (file: StoredFile) => {
    const primary = await readRawBytes(file);
    try {
      await PDFDocument.load(primary);
      return primary;
    } catch {
      if (!file.data) {
        throw new Error("Failed to read uploaded PDF.");
      }

      const fallback = decodeBase64Payload(file.data);
      try {
        await PDFDocument.load(fallback);
        return fallback;
      } catch {
        throw new Error("Uploaded file is not a readable PDF.");
      }
    }
  };

  const readRawBytes = async (file: StoredFile) => {
    if (file.file) {
      return new Uint8Array(await file.file.arrayBuffer());
    }

    if (!file.data) {
      throw new Error("Missing file data.");
    }

    const payload = file.data.trim();
    if (payload.startsWith("data:") || payload.startsWith("blob:")) {
      const response = await fetch(payload);
      if (!response.ok) {
        throw new Error("Failed to load stored file data.");
      }
      return new Uint8Array(await response.arrayBuffer());
    }

    return decodeBase64Payload(payload);
  };

  const decodeBase64Payload = (value: string) => {
    const clean = value.includes(",") ? value.split(",")[1] : value;
    const normalized = clean.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      normalized.length % 4 === 0
        ? normalized
        : normalized + "=".repeat(4 - (normalized.length % 4));
    return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  };

  const getCompressionLevelFromState = (): "low" | "medium" | "high" => {
    const value = localStorage.getItem("compressionLevel");
    if (value === "low" || value === "medium" || value === "high") {
      return value;
    }
    return "medium";
  };

  const parsePageSelection = (input: string, totalPages: number) => {
    const allPages = new Set<number>();
    for (let i = 1; i <= totalPages; i++) allPages.add(i);

    const trimmed = input.trim();
    if (!trimmed) return allPages;

    const selected = new Set<number>();
    const tokens = trimmed.split(",").map((token) => token.trim()).filter(Boolean);

    for (const token of tokens) {
      if (token.includes("-")) {
        const [startRaw, endRaw] = token.split("-").map((v) => parseInt(v, 10));
        if (Number.isNaN(startRaw) || Number.isNaN(endRaw)) continue;
        const start = Math.max(1, Math.min(startRaw, endRaw));
        const end = Math.min(totalPages, Math.max(startRaw, endRaw));
        for (let p = start; p <= end; p++) selected.add(p);
        continue;
      }

      const page = parseInt(token, 10);
      if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
        selected.add(page);
      }
    }

    return selected.size ? selected : allPages;
  };

  const toRoman = (num: number) => {
    const map: [string, number][] = [
      ["M", 1000], ["CM", 900], ["D", 500], ["CD", 400],
      ["C", 100], ["XC", 90], ["L", 50], ["XL", 40],
      ["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1],
    ];

    let result = "";
    let value = num;
    for (const [letter, number] of map) {
      while (value >= number) {
        result += letter;
        value -= number;
      }
    }
    return result;
  };

  const toLetter = (num: number) => {
    let result = "";
    let value = num;
    while (value > 0) {
      value--;
      result = String.fromCharCode(65 + (value % 26)) + result;
      value = Math.floor(value / 26);
    }
    return result;
  };

  const makeBlobUrl = (bytes: Uint8Array) => {
    const normalized = new Uint8Array(bytes.byteLength);
    normalized.set(bytes);
    return URL.createObjectURL(new Blob([normalized.buffer], { type: "application/pdf" }));
  };

  const download = (url: string, index: number) => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `result-${index + 1}.pdf`;
    anchor.click();
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (status === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md text-center px-6">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-6" />
          <p className="mb-2 text-sm text-gray-600">{stage}</p>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="bg-black h-3 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-sm font-medium">{progress}%</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p>{error || "Processing failed."}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div>
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />

        <h2 className="text-xl font-semibold mb-4">
          {toolId === "jpeg-to-pdf" ? "JPEG converted to PDF!" : toolId === "png-to-pdf" ? "PNG converted to PDF!" : "Completed successfully"}
        </h2>

        {downloadUrls.map((url, index) => (
          <button
            key={index}
            onClick={() => download(url, index)}
            className="block mx-auto mb-3 px-6 py-3 bg-black text-white rounded-lg"
          >
            Download File {index + 1}
          </button>
        ))}

        {toolId === "pdf-compress" && originalSize && compressedSize && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm">
            <p>Original: {(originalSize / 1024 / 1024).toFixed(2)} MB</p>
            <p>Compressed: {(compressedSize / 1024 / 1024).toFixed(2)} MB</p>
            <p className="font-semibold text-green-600">
              Reduced {(((originalSize - compressedSize) / originalSize) * 100).toFixed(1)}%
            </p>
          </div>
        )}

        {toolId === "ocr" && (
          <button onClick={copyText} className="mt-4 px-6 py-3 border rounded-lg">
            <Copy className="inline w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy Text"}
          </button>
        )}
      </div>
    </div>
  );
}
