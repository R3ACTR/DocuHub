"use client";

import { Loader2, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Tesseract from "tesseract.js";
import { getStoredFiles, clearStoredFiles } from "@/lib/fileStore";
import { PDFDocument, rgb, degrees } from "pdf-lib";

type StoredFile = {
  data: string;
  name: string;
  type: string;
};

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

  /* ================= RUN TOOL ================= */
  useEffect(() => {
    const run = async () => {
      const stored = getStoredFiles() as StoredFile[];

      if (!stored?.length) {
        router.push(`/tool/${toolId}`);
        return;
      }

      try {
        if (toolId === "ocr") await runOCR(stored[0].data);

        else if (toolId === "pdf-protect") await protectPDF(stored);

        else if (toolId === "jpeg-to-pdf") await imageToPdf(stored, "jpg");

        else if (toolId === "png-to-pdf") await imageToPdf(stored, "png");

        else if (toolId === "pdf-watermark") await watermarkPDF(stored);

        else if (toolId === "pdf-compress") {
          const originalBytes = base64ToBytes(stored[0].data);
          setOriginalSize(originalBytes.length);
          await startCompressFlow(stored);
        }

        else if (toolId === "pdf-page-numbers") {
          await addPageNumbers(stored[0].data);
        }

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
          setStage("Recognizing Text...");
          setProgress(Math.round(m.progress * 100));
        }
        if (m.status === "loading tesseract core") {
          setStage("Loading OCR Engine...");
        }
      },
    });

    setStage("Finalizing...");
    setText(res.data.text);
    setProgress(100);
    setStatus("done");
  };

  /* ================= COMPRESS ================= */
  const startCompressFlow = async (files: StoredFile[]) => {
    setStage("Preparing file...");
    setProgress(20);

    const targetSize = localStorage.getItem("targetSize") || "1MB";

    const targetBytes = targetSize.includes("KB")
      ? Number(targetSize.replace("KB", "")) * 1024
      : Number(targetSize.replace("MB", "")) * 1024 * 1024;

    setStage("Compressing PDF...");
    setProgress(50);

    const res = await fetch("/api/compress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: files.map(f => ({ base64: f.data })),
        targetBytes,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data?.results?.length)
      throw new Error("Compression failed");

    setStage("Finalizing...");
    setProgress(85);

    const bytes = Uint8Array.from(
      atob(data.results[0].file),
      c => c.charCodeAt(0)
    );

    setCompressedSize(bytes.length);
    setDownloadUrls([makeBlobUrl(bytes)]);

    setProgress(100);
    setStatus("done");
  };

  /* ================= WATERMARK ================= */
  const watermarkPDF = async (files: StoredFile[]) => {
    const text = localStorage.getItem("watermarkText") || "";
    const rotation = Number(localStorage.getItem("watermarkRotation") || 45);
    const opacity = Number(localStorage.getItem("watermarkOpacity") || 40) / 100;

    const urls: string[] = [];

    for (const f of files) {
      const bytes = base64ToBytes(f.data);
      const pdf = await PDFDocument.load(bytes);
      const pages = pdf.getPages();

      pages.forEach(page => {
        const { width, height } = page.getSize();
        page.drawText(text, {
          x: width / 3,
          y: height / 2,
          size: 50,
          rotate: degrees(rotation),
          color: rgb(0.75, 0.75, 0.75),
          opacity,
        });
      });

      const saved = await pdf.save();
      urls.push(makeBlobUrl(saved));
    }

    setDownloadUrls(urls);
    setStatus("done");
  };

  /* ================= PDF PROTECT ================= */
  const protectPDF = async (files: StoredFile[]) => {
    const urls: string[] = [];

    for (const f of files) {
      const bytes = base64ToBytes(f.data);
      const pdf = await PDFDocument.load(bytes);
      const saved = await pdf.save();
      urls.push(makeBlobUrl(saved));
    }

    setDownloadUrls(urls);
    setStatus("done");
  };

  /* ================= IMAGE → PDF ================= */
  const imageToPdf = async (files: StoredFile[], type: "jpg" | "png") => {
    const urls: string[] = [];

    for (const f of files) {
      const bytes = base64ToBytes(f.data);
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
      urls.push(makeBlobUrl(saved));
    }

    setDownloadUrls(urls);
    setStatus("done");
  };

  /* ================= PAGE NUMBERS ================= */
  const addPageNumbers = async (base64: string) => {
    const bytes = base64ToBytes(base64);
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

    const saved = await pdfDoc.save();
    setDownloadUrls([makeBlobUrl(saved)]);
    setStatus("done");
  };

  const toRoman = (num: number) => {
    const map: [string, number][] = [
      ["M",1000],["CM",900],["D",500],["CD",400],
      ["C",100],["XC",90],["L",50],["XL",40],
      ["X",10],["IX",9],["V",5],["IV",4],["I",1]
    ];
    let result = "";
    let n = num;
    for (const [l,v] of map) {
      while (n>=v){ result+=l; n-=v; }
    }
    return result;
  };

  const toLetter = (num:number)=>{
    let r=""; let n=num;
    while(n>0){ n--; r=String.fromCharCode(65+(n%26))+r; n=Math.floor(n/26); }
    return r;
  };

  /* ================= HELPERS ================= */
  const base64ToBytes = (base64:string)=>{
    const clean = base64.includes(",") ? base64.split(",")[1] : base64;
    return Uint8Array.from(atob(clean), c=>c.charCodeAt(0));
  };

  const makeBlobUrl = (bytes:Uint8Array)=>{
    const blob = new Blob([bytes],{type:"application/pdf"});
    return URL.createObjectURL(blob);
  };

  const download=(url:string,index:number)=>{
    const a=document.createElement("a");
    a.href=url;
    a.download=`result-${index+1}.pdf`;
    a.click();
  };

  const copyText=async()=>{
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(()=>setCopied(false),1500);
  };

  /* ================= UI ================= */

  if(status==="processing")
    return(
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md text-center px-6">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-6"/>
          <p className="mb-2 text-sm text-gray-600">{stage}</p>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="bg-black h-3 transition-all duration-500" style={{width:`${progress}%`}}/>
          </div>
          <p className="mt-2 text-sm font-medium">{progress}%</p>
        </div>
      </div>
    );

  if(status==="error")
    return(
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3"/>
          <p>{error}</p>
        </div>
      </div>
    );

  return(
    <div className="min-h-screen flex items-center justify-center text-center">
      <div>
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4"/>

        <h2 className="text-xl font-semibold mb-4">
          {toolId==="jpeg-to-pdf"?"JPEG Converted to PDF!"
          :toolId==="png-to-pdf"?"PNG Converted to PDF!"
          :"Completed Successfully"}
        </h2>

        {downloadUrls.map((url,i)=>(
          <button
            key={i}
            onClick={()=>download(url,i)}
            className="block mx-auto mb-3 px-6 py-3 bg-black text-white rounded-lg"
          >
            Download File {i+1}
          </button>
        ))}

        {toolId==="pdf-compress" && originalSize && compressedSize && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm">
            <p>Original: {(originalSize/1024/1024).toFixed(2)} MB</p>
            <p>Compressed: {(compressedSize/1024/1024).toFixed(2)} MB</p>
            <p className="font-semibold text-green-600">
              Reduced {(((originalSize-compressedSize)/originalSize)*100).toFixed(1)}%
            </p>
          </div>
        )}

        {toolId==="ocr" && (
          <button onClick={copyText} className="mt-4 px-6 py-3 border rounded-lg">
            <Copy className="inline w-4 h-4 mr-2"/>
            {copied?"Copied!":"Copy Text"}
          </button>
        )}
      </div>
    </div>
  );
}
