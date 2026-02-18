                                                                                                                                                                                                                                                                              
 "use client";
                                                                                                                                                                
  import { useRef, useState } from "react";                                                                                                                     
  import { PDFDocument, StandardFonts } from "pdf-lib";                                                                                                         
  import type { PDFFont } from "pdf-lib";                                                                                                                       
  import * as mammoth from "mammoth";                                                                                                                           
  import { buildThreatWarning, scanUploadedFiles } from "@/lib/security/virusScan";                                                                             
  import { toolToast } from "@/lib/toolToasts";                                                                                                                 
                                                                                                                                                                
  function sanitizeForWinAnsi(text: string, font: PDFFont) {                                                                                                    
    let result = "";                                                                                                                                            
    for (const char of text) {                                                                                                                                  
      try {                                                                                                                                                     
        font.encodeText(char);                                                                                                                                  
        result += char;                                                                                                                                         
      } catch {                                                                                                                                                 
        result += " ";                                                                                                                                          
      }                                                                                                                                                         
    }                                                                                                                                                           
    return result;                                                                                                                                              
  }                                                                                                                                                             
                                                                                                                                                                
  function saveRecentFile(fileName: string, tool: string) {                                                                                                     
    const existing = localStorage.getItem("recentFiles");                                                                                                       
    let files = existing ? JSON.parse(existing) : [];                                                                                                           
                                                                                                                                                                
    const newEntry = {                                                                                                                                          
      fileName,                                                                                                                                                 
      tool,                                                                                                                                                     
      time: new Date().toLocaleString(),                                                                                                                        
      link: "/dashboard/document-to-pdf",                                                                                                                       
    };                                                                                                                                                          
                                                                                                                                                                
    files.unshift(newEntry);                                                                                                                                    
    files = files.slice(0, 5);                                                                                                                                  
                                                                                                                                                                
    localStorage.setItem("recentFiles", JSON.stringify(files));                                                                                                 
  }                                                                                                                                                             
                                                                                                                                                                
  export default function DocumentToPdfPage() {                                                                                                                 
    const [files, setFiles] = useState<File[]>([]);                                                                                                             
    const [loading, setLoading] = useState(false);                                                                                                              
    const [error, setError] = useState("");                                                                                                                     
    const [scanState, setScanState] = useState<"idle" | "scanning" | "clean" | "threat">("idle");                                                               
    const [scanMessage, setScanMessage] = useState("");                                                                                                         
    const [isDragging, setIsDragging] = useState(false);                                                                                                        
    const fileInputRef = useRef<HTMLInputElement>(null);                                                                                                        
                                                                                                                                                                
    const ALLOWED_TYPES = [".txt", ".html", ".json", ".docx"];                                                                                                  
                                                                                                                                                                
    const isValidFileType = (fileName?: string) => {                                                                                                            
      if (!fileName) return false;                                                                                                                              
      return ALLOWED_TYPES.some((ext) => fileName.toLowerCase().endsWith(ext));                                                                                 
    };                                                                                                                                                          
                                                                                                                                                                
    const processSelectedFiles = async (incomingFiles: File[]) => {                                                                                             
      if (!incomingFiles.length) return;                                                                                                                        
                                                                                                                                                                
      const validFiles: File[] = [];                                                                                                                            
      const invalidFileNames: string[] = [];                                                                                                                    
                                                                                                                                                                
      for (const file of incomingFiles) {                                                                                                                       
        if (isValidFileType(file.name)) {                                                                                                                       
          validFiles.push(file);
        } else {                                                                                                                                                
          invalidFileNames.push(file.name);                                                                                                                     
        }                                                                                                                                                       
      }                                                                                                                                                         
                                                                                                                                                                
      if (!validFiles.length) {                                                                                                                                 
        const message = "Unsupported file type. Please upload: .txt, .html, .json, .docx";                                                                      
        setError(message);                                                                                                                                      
        toolToast.warning("Unsupported format. Use TXT, HTML, JSON, or DOCX.");                                                                                 
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      const { cleanFiles, threats } = await scanUploadedFiles(validFiles);                                                                                      
                                                                                                                                                                
      if (!cleanFiles.length) {                                                                                                                                 
        const warning = buildThreatWarning(threats) || "All selected files were blocked.";                                                                      
        setError(warning);                                                                                                                                      
        setScanState("threat");                                                                                                                                 
        setScanMessage(warning);                                                                                                                                
        toolToast.error("All selected files were blocked by security scan.");                                                                                   
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      setFiles((prev) => {                                                                                                                                      
        const merged = [...prev, ...cleanFiles];                                                                                                                
        return merged.filter(                                                                                                                                   
          (file, index, arr) =>                                                                                                                                 
            arr.findIndex(                                                                                                                                      
              (f) =>                                                                                                                                            
                f.name === file.name &&                                                                                                                         
                f.size === file.size &&                                                                                                                         
                f.lastModified === file.lastModified                                                                                                            
            ) === index                                                                                                                                         
        );                                                                                                                                                      
      });                                                                                                                                                       
                                                                                                                                                                
      const warnings: string[] = [];                                                                                                                            
      if (invalidFileNames.length) {                                                                                                                            
        warnings.push(                                                                                                                                          
          `Ignored unsupported files: ${invalidFileNames.join(", ")}. Allowed types: .txt, .html, .json, .docx`                                                 
        );                                                                                                                                                      
        toolToast.warning("Some files were skipped. Use TXT, HTML, JSON, or DOCX.");                                                                            
      }                                                                                                                                                         
                                                                                                                                                                
      if (threats.length) {                                                                                                                                     
        warnings.push(buildThreatWarning(threats));                                                                                                             
        toolToast.warning("Some files were blocked by security scan.");                                                                                         
      }                                                                                                                                                         
                                                                                                                                                                
      setError(warnings.join(" ").trim());                                                                                                                      
      setScanState("idle");                                                                                                                                     
      setScanMessage('Click "Scan Files" before converting.');                                                                                                  
    };                                                                                                                                                          
                                                                                                                                                                
    const runScan = async () => {                                                                                                                               
      if (!files.length) return;                                                                                                                                
                                                                                                                                                                
      setScanState("scanning");                                                                                                                                 
      setScanMessage("Scanning files...");                                                                                                                      
      setError("");                                                                                                                                             
      toolToast.info("Scanning files...");                                                                                                                      
                                                                                                                                                                
      const { cleanFiles, threats } = await scanUploadedFiles(files);                                                                                           
                                                                                                                                                                
      if (!cleanFiles.length) {                                                                                                                                 
        const warning = buildThreatWarning(threats) || "Security scan failed.";                                                                                 
        setFiles([]);                                                                                                                                           
        setError(warning);
        setScanState("threat");                                                                                                                                 
        setScanMessage(warning);                                                                                                                                
        toolToast.error("Scan failed. No safe files available.");                                                                                               
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      setFiles(cleanFiles);                                                                                                                                     
      if (threats.length) {                                                                                                                                     
        setError(buildThreatWarning(threats));                                                                                                                  
        setScanMessage(`Scan complete. ${threats.length} unsafe file(s) were blocked.`);                                                                        
        toolToast.warning(`${threats.length} unsafe file(s) were blocked.`);                                                                                    
      } else {                                                                                                                                                  
        setScanMessage("Scan complete. No threats detected.");                                                                                                  
        toolToast.success("Scan complete. No threats detected.");                                                                                               
      }                                                                                                                                                         
      setScanState("clean");                                                                                                                                    
    };                                                                                                                                                          
                                                                                                                                                                
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {                                                                                
      if (!e.target.files?.length) return;                                                                                                                      
      await processSelectedFiles(Array.from(e.target.files));                                                                                                   
      e.target.value = "";                                                                                                                                      
    };                                                                                                                                                          
                                                                                                                                                                
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {                                                                                          
      e.preventDefault();                                                                                                                                       
      setIsDragging(false);                                                                                                                                     
                                                                                                                                                                
      if (!e.dataTransfer.files?.length) return;                                                                                                                
      await processSelectedFiles(Array.from(e.dataTransfer.files));                                                                                             
    };                                                                                                                                                          
                                                                                                                                                                
    const handleRemoveFile = (indexToRemove: number) => {                                                                                                       
      setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));                                                                                   
      setScanState("idle");                                                                                                                                     
      setScanMessage('Click "Scan Files" before converting.');                                                                                                  
      setError("");                                                                                                                                             
    };                                                                                                                                                          
                                                                                                                                                                
    const clearSelection = () => {                                                                                                                              
      setFiles([]);                                                                                                                                             
      setError("");                                                                                                                                             
      setScanState("idle");                                                                                                                                     
      setScanMessage("");                                                                                                                                       
      if (fileInputRef.current) {
        fileInputRef.current.value = "";                                                                                                                        
      }                                                                                                                                                         
    };                                                                                                                                                          
                                                                                                                                                                
    const convertFileToPdf = async (file: File): Promise<Uint8Array> => {                                                                                       
      let text = "";                                                                                                                                            
                                                                                                                                                                
      if (file.name.toLowerCase().endsWith(".docx")) {                                                                                                          
        const arrayBuffer = await file.arrayBuffer();                                                                                                           
        const result = await mammoth.extractRawText({ arrayBuffer });                                                                                           
        text = result.value || "";                                                                                                                              
      } else {                                                                                                                                                  
        text = await file.text();                                                                                                                               
      }                                                                                                                                                         
                                                                                                                                                                
      if (!text || text.trim().length === 0) {                                                                                                                  
        throw new Error(`No readable text found in ${file.name}`);                                                                                              
      }                                                                                                                                                         
                                                                                                                                                                
      const pdfDoc = await PDFDocument.create();                                                                                                                
      const page = pdfDoc.addPage([595, 842]);                                                                                                                  
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);                                                                                             
      text = sanitizeForWinAnsi(text, font);                                                                                                                    
                                                                                                                                                                
      const fontSize = 12;                                                                                                                                      
      const margin = 50;                                                                                                                                        
      const { width, height } = page.getSize();                                                                                                                 
                                                                                                                                                                
      const words = text.split(/\s+/);                                                                                                                          
      const lines: string[] = [];                                                                                                                               
      let currentLine = "";                                                                                                                                     
                                                                                                                                                                
      for (const word of words) {                                                                                                                               
        const test = currentLine + word + " ";                                                                                                                  
        const w = font.widthOfTextAtSize(test, fontSize);                                                                                                       
                                                                                                                                                                
        if (w > width - margin * 2 && currentLine !== "") {                                                                                                     
          lines.push(currentLine);                                                                                                                              
          currentLine = word + " ";                                                                                                                             
        } else {                                                                                                                                                
          currentLine = test;                                                                                                                                   
        }                                                                                                                                                       
      }                                                                                                                                                         
                                                                                                                                                                
      if (currentLine) lines.push(currentLine);                                                                                                                 
                                                                                                                                                                
      let y = height - margin;                                                                                                                                  
                                                                                                                                                                
      for (const line of lines) {                                                                                                                               
        if (y < margin) break;                                                                                                                                  
                                                                                                                                                                
        page.drawText(line, {                                                                                                                                   
          x: margin,                                                                                                                                            
          y,                                                                                                                                                    
          size: fontSize,
          font,                                                                                                                                                 
        });                                                                                                                                                     
                                                                                                                                                                
        y -= fontSize + 6;                                                                                                                                      
      }                                                                                                                                                         
                                                                                                                                                                
      return new Uint8Array(await pdfDoc.save());                                                                                                               
    };                                                                                                                                                          
                                                                                                                                                                
    const downloadPdf = (pdfBytes: Uint8Array, sourceFileName: string) => {                                                                                     
      const blob = new Blob([pdfBytes], { type: "application/pdf" });                                                                                           
      const url = URL.createObjectURL(blob);                                                                                                                    
                                                                                                                                                                
      const a = document.createElement("a");                                                                                                                    
      a.href = url;                                                                                                                                             
      a.download = sourceFileName.replace(/\.[^/.]+$/, "") + ".pdf";                                                                                            
      a.click();                                                                                                                                                

      URL.revokeObjectURL(url);                                                                                                                                 
    };
                                                                                                                                                                
    const handleConvert = async () => {                                                                                                                         
      if (!files.length) return;                                                                                                                                
      if (scanState !== "clean") {                                                                                                                              
        setError('Please click "Scan Files" before converting.');                                                                                               
        toolToast.warning('Please click "Scan Files" before converting.');                                                                                      
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      setLoading(true);                                                                                                                                         
      setError("");                                                                                                                                             
      toolToast.info("Converting document to PDF...");                                                                                                          
                                                                                                                                                                
      try {                                                                                                                                                     
        const conversionResults = await Promise.all(                                                                                                            
          files.map(async (file) => ({                                                                                                                          
            file,                                                                                                                                               
            pdfBytes: await convertFileToPdf(file),                                                                                                             
          }))                                                                                                                                                   
        );                                                                                                                                                      
                                                                                                                                                                
        for (const { file, pdfBytes } of conversionResults) {                                                                                                   
          downloadPdf(pdfBytes, file.name);                                                                                                                     
          saveRecentFile(file.name, "Document to PDF");                                                                                                         
        }                                                                                                                                                       
                                                                                                                                                                
        toolToast.success(                                                                                                                                      
          conversionResults.length === 1                                                                                                                        
            ? "File is ready for download."                                                                                                                     
            : `${conversionResults.length} files are ready for download.`                                                                                       
        );                                                                                                                                                      
      } catch (err) {                                                                                                                                           
        console.error(err);                                                                                                                                     
        setError("Conversion failed");                                                                                                                          
        toolToast.error("Processing failed. Conversion could not be completed.");                                                                               
      } finally {                                                                                                                                               
        setLoading(false);                                                                                                                                      
      }                                                                                                                                                         
    };                                                                                                                                                          
                                                                                                                                                                
    return (                                                                                                                                                    
      <div className="mx-auto my-10 max-w-2xl px-4">                                                                                                            
        <h1 className="text-3xl font-semibold">Document to PDF</h1>                                                                                             
                                                                                                                                                                
        <input                                                                                                                                                  
          ref={fileInputRef}                                                                                                                                    
          type="file"                                                                                                                                           
          multiple                                                                                                                                              
          accept=".txt,.html,.json,.docx"                                                                                                                       
          onChange={handleFileChange}                                                                                                                           
          className="hidden"                                                                                                                                    
        />                                                                                                                                                      
                                                                                                                                                                
        <div                                                                                                                                                    
          onDrop={handleDrop}                                                                                                                                   
          onDragOver={(e) => {                                                                                                                                  
            e.preventDefault();                                                                                                                                 
            setIsDragging(true);                                                                                                                                
          }}                                                                                                                                                    
          onDragLeave={() => setIsDragging(false)}                                                                                                              
          onClick={() => fileInputRef.current?.click()}                                                                                                         
          className={`mt-5 cursor-pointer rounded-xl border-2 p-10 text-center transition ${                                                                    
            isDragging                                                                                                                                          
              ? "border-accent bg-accent/10"                                                                                                                    
              : "border-dashed border-border bg-muted/40"                                                                                                       
          }`}                                                                                                                                                   
        >                                                                                                                                                       
          <p className="text-lg">                                                                                                                               
            {isDragging ? "Drop files here" : "Drop files here or click to upload"}                                                                             
          </p>                                                                                                                                                  
        </div>                                                                                                                                                  
                                                                                                                                                                
        {error && <p className="mt-3 text-danger">{error}</p>}                                                                                                  
        {scanMessage && (                                                                                                                                       
          <p className={`mt-2 ${scanState === "clean" ? "text-green-600" : "text-muted-foreground"}`}>                                                          
            {scanMessage}                                                                                                                                       
          </p>                                                                                                                                                  
        )}                                                                                                                                                      
                                                                                                                                                                
        {files.length > 0 && (                                                                                                                                  
          <>                                                                                                                                                    
            <div className="mt-5 grid gap-3">                                                                                                                   
              {files.map((file, index) => (                                                                                                                     
                <div                                                                                                                                            
                  key={`${file.name}-${file.size}-${file.lastModified}`}                                                                                        
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"                                               
                >                                                                                                                                               
                  <span className="truncate">{file.name}</span>                                                                                                 
                  <button                                                                                                                                       
                    onClick={() => handleRemoveFile(index)}                                                                                                     
                    className="rounded-md bg-danger px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"                                               
                  >                                                                                                                                             
                    Remove                                                                                                                                      
                  </button>                                                                                                                                     
                </div>                                                                                                                                          
              ))}
            </div>                                                                                                                                              
                                                                                                                                                                
            <button                                                                                                                                             
              onClick={clearSelection}                                                                                                                          
              className="mt-3 rounded-md border border-border px-3 py-1.5 text-muted-foreground hover:bg-muted"                                                 
            >                                                                                                                                                   
              Clear all                                                                                                                                         
            </button>
          </>                                                                                                                                                   
        )}                                                                                                                                                      
                                                                                                                                                                
        <button                                                                                                                                                 
          onClick={runScan}                                                                                                                                     
          disabled={loading || files.length === 0 || scanState === "scanning"}                                                                                  
          className={`mt-6 rounded-lg px-6 py-3 ${                                                                                                              
            loading || files.length === 0 || scanState === "scanning"                                                                                           
              ? "cursor-not-allowed bg-muted text-muted-foreground"                                                                                             
              : "border border-foreground bg-background text-foreground hover:opacity-90"                                                                       
          }`}                                                                                                                                                   
        >                                                                                                                                                       
          {scanState === "scanning" ? "Scanning..." : "Scan Files"}                                                                                             
        </button>                                                                                                                                               
                                                                                                                                                                
        <button                                                                                                                                                 
          onClick={handleConvert}                                                                                                                               
          disabled={loading || files.length === 0 || scanState !== "clean"}                                                                                     
          className={`mt-3 rounded-lg px-6 py-3 ${                                                                                                              
            loading || files.length === 0 || scanState !== "clean"                                                                                              
              ? "cursor-not-allowed bg-muted text-muted-foreground"                                                                                             
              : "bg-primary text-primary-foreground hover:opacity-90"                                                                                           
          }`}                                                                                                                                                   
        >                                                                                                                                                       
          {loading ? "Converting..." : `Convert ${files.length} file(s) to PDF`}                                                                                
        </button>                                                                                                                                               
      </div>                                                                                                                                                    
    );                                                                                                                                                          
  } 