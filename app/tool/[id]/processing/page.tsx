"use client";

import { Loader2, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Tesseract from "tesseract.js";
import { getStoredFiles, clearStoredFiles } from "@/lib/fileStore";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { protectPdfBytes } from "@/lib/pdfProtection";
import ToolFeedbackPrompt from "@/components/ToolFeedbackPrompt";
import { toolToast } from "@/lib/toolToasts";

type StoredFile = {
  data: string;
  name: string;
  type: string;
  file?: File;
  password?: string;
};

type DownloadItem = {
  url: string;
  name: string;
};

type CompressionApiResponse = {
  status: "no_target" | "target_reached" | "target_unreachable";
  targetBytes: number | null;
  originalBytes: number;
  compressedBytes: number;
  settings?: {
    requestedLevel: "low" | "medium" | "high";
    appliedLevel: "low" | "medium" | "high";
    useObjectStreams: boolean;
    rewriteMode: "direct" | "rebuilt";
  };
  outputBase64: string;
  error?: string;
};
const SUPPORTED_PROCESSING_TOOLS = new Set([
  "ocr",
  "pdf-protect",
  "jpeg-to-pdf",
  "png-to-pdf",
  "pdf-watermark",
  "pdf-redact",
  "metadata-viewer",
  "pdf-extract-images",
  "pdf-delete-pages",
  "pdf-page-reorder",
  "pdf-password-remover",
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
  const [copiedDownloadIndex, setCopiedDownloadIndex] = useState<number | null>(null);

  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressionTargetBytes, setCompressionTargetBytes] = useState<number | null>(null);
  const [compressionTargetStatus, setCompressionTargetStatus] = useState<
    "no_target" | "target_reached" | "target_unreachable"
  >("no_target");
  const [compressionLevelUsed, setCompressionLevelUsed] = useState<"low" | "medium" | "high">(
    "medium",
  );
  const [compressionRewriteMode, setCompressionRewriteMode] = useState<"direct" | "rebuilt">(
    "direct",
  );
  const [compressionUsesObjectStreams, setCompressionUsesObjectStreams] = useState(false);
  const [hasShownResultToast, setHasShownResultToast] = useState(false);

  useEffect(() => {
    return () => {
      downloadItems.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [downloadItems]);

  useEffect(() => {
    const run = async () => {
      const stored = getStoredFiles() as StoredFile[];

      if (!SUPPORTED_PROCESSING_TOOLS.has(toolId)) {
        const message = `Unsupported tool "${toolId}". Please choose an available tool from the dashboard.`;
        setError(message);
        toolToast.warning("Unsupported tool. Please select an available tool.");
        setStatus("error");
        return;
      }

      if (!stored?.length) {
        toolToast.info("No file found. Please upload again.");
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
        } else if (toolId === "pdf-redact") {
          await redactPdf(stored[0]);
        } else if (toolId === "metadata-viewer") {
          await viewMetadata(stored[0]);
        } else if (toolId === "pdf-extract-images") {
          await extractPageImages(stored[0]);
        } else if (toolId === "pdf-delete-pages") {
          await deletePages(stored[0]);
        } else if (toolId === "pdf-page-reorder") {
          await reorderPages(stored[0]);
        } else if (toolId === "pdf-password-remover") {
          await removePassword(stored[0]);
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
        const message = e instanceof Error ? e.message : "Processing failed.";
        setError(message);
        toolToast.error(message);
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

    const level = getCompressionLevelFromState();
    const targetBytes = getCompressionTargetBytesFromState();
    setCompressionTargetBytes(targetBytes);
    setStage(`Compressing PDF (${level})...`);
    setProgress(45);

    const payload = new FormData();
    payload.append(
      "file",
      new File([sourceBytes], file.name || "upload.pdf", {
        type: file.type || "application/pdf",
      }),
    );
    payload.append("compressionLevel", level);
    if (targetBytes != null) {
      payload.append("targetBytes", String(targetBytes));
    }

    const response = await fetch("/api/compress", {
      method: "POST",
      body: payload,
    });
    const result = (await response.json()) as CompressionApiResponse;

    if (!response.ok) {
      throw new Error(result.error || "Compression API request failed.");
    }

    if (!result.outputBase64) {
      throw new Error("Compression API returned no output.");
    }

    const finalBytes = decodeBase64Payload(result.outputBase64);
    setCompressionTargetStatus(result.status || "no_target");
    setCompressionTargetBytes(result.targetBytes);
    setCompressionLevelUsed(result.settings?.appliedLevel || level);
    setCompressionRewriteMode(result.settings?.rewriteMode || "direct");
    setCompressionUsesObjectStreams(Boolean(result.settings?.useObjectStreams));
    if (result.status === "target_unreachable") {
      toolToast.warning("Target size was not reached. Downloading the closest result.");
    }

    setStage("Finalizing...");
    setProgress(85);
    setCompressedSize(result.compressedBytes || finalBytes.length);
    setDownloadItems([
      {
        url: makeBlobUrl(finalBytes, "application/pdf"),
        name: "compressed.pdf",
      },
    ]);
    setProgress(100);
    setStatus("done");
  };

  const watermarkPDF = async (files: StoredFile[]) => {
    const textValue = localStorage.getItem("watermarkText") || "";
    const rotation = Number(localStorage.getItem("watermarkRotation") || 45);
    const opacity = Number(localStorage.getItem("watermarkOpacity") || 40) / 100;
    const items: DownloadItem[] = [];

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

      items.push({
        url: makeBlobUrl(await pdf.save(), "application/pdf"),
        name: `${stripExtension(file.name)}-watermarked.pdf`,
      });
    }

    setDownloadItems(items);
    setStatus("done");
  };

  const protectPDF = async (files: StoredFile[]) => {
    const items: DownloadItem[] = [];

    for (const f of files) {
      if (!f.password?.trim()) {
        throw new Error("Password is required to protect PDF.");
      }

      const bytes = await readRawBytes(f);
      const encrypted = await protectPdfBytes(bytes, f.password);
      items.push({
        url: makeBlobUrl(new Uint8Array(encrypted), "application/pdf"),
        name: `${stripExtension(f.name)}-protected.pdf`,
      });
    }

    setDownloadItems(items);
    setStatus("done");
  };

  const imageToPdf = async (files: StoredFile[], type: "jpg" | "png") => {
    const items: DownloadItem[] = [];

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

      items.push({
        url: makeBlobUrl(await pdf.save(), "application/pdf"),
        name: `${stripExtension(file.name)}.pdf`,
      });
    }

    setDownloadItems(items);
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

    setDownloadItems([
      {
        url: makeBlobUrl(await pdfDoc.save(), "application/pdf"),
        name: `${stripExtension(file.name)}-page-numbers.pdf`,
      },
    ]);
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

    const items: DownloadItem[] = [];

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

      items.push({
        url: makeBlobUrl(await pdf.save(), "application/pdf"),
        name: `${stripExtension(file.name)}-rotated.pdf`,
      });
    }

    setDownloadItems(items);
    setStatus("done");
  };

  const redactPdf = async (file: StoredFile) => {
    setStage("Redacting PDF...");
    setProgress(15);

    const bytes = await readPdfBytes(file);
    const inputPdf = await loadPdfJsDocument(bytes, file.name);
    const outputPdf = await PDFDocument.create();

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Canvas context is unavailable.");
    }

    for (let pageNumber = 1; pageNumber <= inputPdf.numPages; pageNumber++) {
      setStage(`Redacting page ${pageNumber}/${inputPdf.numPages}...`);
      setProgress(15 + Math.round((pageNumber / inputPdf.numPages) * 70));

      const page = await inputPdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Image encoding failed"))),
          "image/png"
        );
      });

      const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
      const image = await outputPdf.embedPng(pngBytes);
      const outPage = outputPdf.addPage([viewport.width, viewport.height]);
      outPage.drawImage(image, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    }

    canvas.width = 0;
    canvas.height = 0;
    await inputPdf.destroy();

    const result = await outputPdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 20,
    });

    setDownloadItems([
      {
        url: makeBlobUrl(result, "application/pdf"),
        name: `${stripExtension(file.name)}-redacted.pdf`,
      },
    ]);
    setProgress(100);
    setStatus("done");
  };

  const viewMetadata = async (file: StoredFile) => {
    setStage("Reading metadata...");
    setProgress(45);

    const bytes = await readPdfBytes(file);
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });

    const metadata = {
      fileName: file.name,
      fileType: file.type || "application/pdf",
      fileSizeBytes: bytes.length,
      pageCount: pdf.getPageCount(),
      title: pdf.getTitle() || null,
      author: pdf.getAuthor() || null,
      subject: pdf.getSubject() || null,
      keywords: pdf.getKeywords() || null,
      creator: pdf.getCreator() || null,
      producer: pdf.getProducer() || null,
      creationDate: pdf.getCreationDate()?.toISOString() || null,
      modificationDate: pdf.getModificationDate()?.toISOString() || null,
    };

    const json = JSON.stringify(metadata, null, 2);
    const jsonBytes = new TextEncoder().encode(json);
    setDownloadItems([
      {
        url: makeBlobUrl(jsonBytes, "application/json"),
        name: `${stripExtension(file.name)}-metadata.json`,
      },
    ]);
    setProgress(100);
    setStatus("done");
  };

  const extractPageImages = async (file: StoredFile) => {
    setStage("Extracting images...");
    setProgress(10);

    const bytes = await readPdfBytes(file);
    const inputPdf = await loadPdfJsDocument(bytes, file.name);
    const format = localStorage.getItem("pdfExtractImageFormat") === "jpg" ? "jpg" : "png";
    const mime = format === "jpg" ? "image/jpeg" : "image/png";
    const quality = format === "jpg" ? 0.9 : undefined;
    const items: DownloadItem[] = [];

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Canvas context is unavailable.");
    }

    for (let pageNumber = 1; pageNumber <= inputPdf.numPages; pageNumber++) {
      setStage(`Rendering page ${pageNumber}/${inputPdf.numPages}...`);
      setProgress(15 + Math.round((pageNumber / inputPdf.numPages) * 75));

      const page = await inputPdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error("Image encoding failed"))),
          mime,
          quality
        );
      });

      const bytesOut = new Uint8Array(await blob.arrayBuffer());
      items.push({
        url: makeBlobUrl(bytesOut, mime),
        name: `${stripExtension(file.name)}-page-${pageNumber}.${format}`,
      });
    }

    canvas.width = 0;
    canvas.height = 0;
    await inputPdf.destroy();

    if (!items.length) {
      throw new Error("No pages available to export.");
    }

    setDownloadItems(items);
    setProgress(100);
    setStatus("done");
  };

  const deletePages = async (file: StoredFile) => {
    const bytes = await readPdfBytes(file);
    const sourcePdf = await PDFDocument.load(bytes);
    const totalPages = sourcePdf.getPageCount();
    const selection = localStorage.getItem("pdfDeletePages") || "";
    const deleteSet = parsePageSelection(selection, totalPages);

    if (!deleteSet.size) {
      throw new Error("No valid pages selected for deletion.");
    }
    if (deleteSet.size >= totalPages) {
      throw new Error("Cannot delete all pages from the document.");
    }

    const keepIndices = Array.from({ length: totalPages }, (_, index) => index).filter(
      (index) => !deleteSet.has(index + 1)
    );
    const outputPdf = await PDFDocument.create();
    const pages = await outputPdf.copyPages(sourcePdf, keepIndices);
    pages.forEach((page) => outputPdf.addPage(page));

    setDownloadItems([
      {
        url: makeBlobUrl(await outputPdf.save(), "application/pdf"),
        name: `${stripExtension(file.name)}-pages-deleted.pdf`,
      },
    ]);
    setStatus("done");
  };

  const reorderPages = async (file: StoredFile) => {
    const bytes = await readPdfBytes(file);
    const sourcePdf = await PDFDocument.load(bytes);
    const totalPages = sourcePdf.getPageCount();
    const rawOrder = localStorage.getItem("pdfReorderPages") || "";
    const order = rawOrder
      .split(",")
      .map((value) => parseInt(value.trim(), 10))
      .filter((value) => !Number.isNaN(value));

    const validSet = new Set(order);
    if (order.length !== totalPages || validSet.size !== totalPages) {
      throw new Error(`Provide each page exactly once (expected ${totalPages} pages).`);
    }
    if (Array.from(validSet).some((value) => value < 1 || value > totalPages)) {
      throw new Error(`Page order must be between 1 and ${totalPages}.`);
    }

    const outputPdf = await PDFDocument.create();
    const pages = await outputPdf.copyPages(
      sourcePdf,
      order.map((value) => value - 1)
    );
    pages.forEach((page) => outputPdf.addPage(page));

    setDownloadItems([
      {
        url: makeBlobUrl(await outputPdf.save(), "application/pdf"),
        name: `${stripExtension(file.name)}-reordered.pdf`,
      },
    ]);
    setStatus("done");
  };

  const removePassword = async (file: StoredFile) => {
    const password = file.password?.trim();
    if (!password) {
      throw new Error("Password is required to remove protection.");
    }

    setStage("Unlocking PDF...");
    setProgress(10);

    const bytes = await readRawBytes(file);
    const inputPdf = await loadPdfJsDocument(bytes, file.name, password);
    const outputPdf = await PDFDocument.create();

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Canvas context is unavailable.");
    }

    for (let pageNumber = 1; pageNumber <= inputPdf.numPages; pageNumber++) {
      setStage(`Rebuilding page ${pageNumber}/${inputPdf.numPages}...`);
      setProgress(15 + Math.round((pageNumber / inputPdf.numPages) * 75));

      const page = await inputPdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });

      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Image encoding failed"))),
          "image/png"
        );
      });

      const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
      const image = await outputPdf.embedPng(pngBytes);
      const outPage = outputPdf.addPage([viewport.width, viewport.height]);
      outPage.drawImage(image, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    }

    canvas.width = 0;
    canvas.height = 0;
    await inputPdf.destroy();

    const unprotected = await outputPdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 20,
    });

    setDownloadItems([
      {
        url: makeBlobUrl(unprotected, "application/pdf"),
        name: `${stripExtension(file.name)}-unlocked.pdf`,
      },
    ]);
    setProgress(100);
    setStatus("done");
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

  const loadPdfJsDocument = async (bytes: Uint8Array, fileName: string, password?: string) => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      disableAutoFetch: true,
      disableStream: true,
      filename: fileName,
      password,
    });
    return loadingTask.promise;
  };

  const getCompressionLevelFromState = (): "low" | "medium" | "high" => {
    const value = localStorage.getItem("compressionLevel");
    if (value === "low" || value === "medium" || value === "high") {
      return value;
    }
    return "medium";
  };

  const getCompressionTargetBytesFromState = () => {
    const raw = localStorage.getItem("compressionTargetBytes") || localStorage.getItem("targetBytes");
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
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

  const makeBlobUrl = (bytes: Uint8Array, type: string) => {
    const normalized = new Uint8Array(bytes.byteLength);
    normalized.set(bytes);
    return URL.createObjectURL(new Blob([normalized.buffer], { type }));
  };

  const stripExtension = (name: string) => name.replace(/\.[^/.]+$/, "");

  const download = (item: DownloadItem, index: number) => {
    const anchor = document.createElement("a");
    anchor.href = item.url;
    anchor.download = item.name || `result-${index + 1}.pdf`;
    anchor.click();
    toolToast.success("Download started.");
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(text);
    toolToast.info("Copied text to clipboard.");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copyDownloadUrl = async (item: DownloadItem, index: number) => {
    await navigator.clipboard.writeText(item.url);
    toolToast.info("Copied download link to clipboard.");
    setCopiedDownloadIndex(index);
    setTimeout(() => setCopiedDownloadIndex(null), 1500);
  };

  useEffect(() => {
    if (status !== "done" || hasShownResultToast) return;
    if (downloadItems.length > 0) {
      toolToast.success(
        downloadItems.length === 1
          ? "File is ready for download."
          : `${downloadItems.length} files are ready for download.`,
      );
    } else {
      toolToast.success("Processing completed successfully.");
    }
    setHasShownResultToast(true);
  }, [status, downloadItems, hasShownResultToast]);

  if (status === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md text-center px-6">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-6" />
          <p className="mb-2 text-sm text-muted-foreground">{stage}</p>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div className="bg-primary h-3 transition-all duration-500" style={{ width: `${progress}%` }} />
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
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-3" />
          <p>{error || "Processing failed."}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 rounded-lg border border-border hover:bg-muted"
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
        <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />

        <h2 className="text-xl font-semibold mb-4">
          {toolId === "jpeg-to-pdf" ? "JPEG converted to PDF!" : toolId === "png-to-pdf" ? "PNG converted to PDF!" : "Completed successfully"}
        </h2>

        {downloadItems.map((item, index) => (
          <div key={index} className="mb-3">
            <button
              onClick={() => download(item, index)}
              className="block mx-auto px-6 py-3 bg-primary text-primary-foreground rounded-lg"
            >
              Download {item.name}
            </button>
            {item.name.toLowerCase().endsWith(".pdf") && (
              <button
                onClick={() => copyDownloadUrl(item, index)}
                className="block mx-auto mt-2 px-4 py-2 border rounded-lg text-sm"
              >
                {copiedDownloadIndex === index ? "Copied PDF URL!" : "Copy PDF URL"}
              </button>
            )}
          </div>
        ))}

        {toolId === "pdf-compress" && originalSize && compressedSize && (
          <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
            <p>Compression level: {compressionLevelUsed}</p>
            <p>Processing mode: {compressionRewriteMode}</p>
            <p>Object streams: {compressionUsesObjectStreams ? "enabled" : "disabled"}</p>
            <p>Original: {(originalSize / 1024 / 1024).toFixed(2)} MB</p>
            <p>Compressed: {(compressedSize / 1024 / 1024).toFixed(2)} MB</p>
            <p className="font-semibold text-success">
              Reduced {(((originalSize - compressedSize) / originalSize) * 100).toFixed(1)}%
            </p>
            {compressionTargetBytes != null && (
              <p className="mt-1">Target: {(compressionTargetBytes / 1024 / 1024).toFixed(2)} MB</p>
            )}
            {compressionTargetStatus === "target_reached" && (
              <p className="font-semibold text-success">Target size reached.</p>
            )}
            {compressionTargetStatus === "target_unreachable" && (
              <p className="font-semibold text-amber-600">
                Target size could not be reached. Downloading closest result.
              </p>
            )}
          </div>
        )}

        {toolId === "ocr" && (
          <div className="mt-4 max-w-3xl">
            <div className="rounded-lg border bg-muted/60 p-4 text-left text-sm whitespace-pre-wrap max-h-72 overflow-auto">
              {text || "No text was extracted."}
            </div>
            <button onClick={copyText} className="mt-4 px-6 py-3 border rounded-lg">
              <Copy className="inline w-4 h-4 mr-2" />
              {copied ? "Copied!" : "Copy Text"}
            </button>
          </div>
        )}

        <ToolFeedbackPrompt toolId={toolId} />
      </div>
    </div>
  );
}

