"use client";
                                                                                                                                                                
  import { useRef, useState } from "react";                                                                                                                     
  import { PDFDocument, StandardFonts } from "pdf-lib";                                                                                                         
  import type { PDFFont } from "pdf-lib";                                                                                                                       
  import * as mammoth from "mammoth";                                                                                                                           
  import { buildThreatWarning, scanUploadedFiles } from "@/lib/security/virusScan";
                                                                                                                                                                
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
        setError("Unsupported file type. Please upload: .txt, .html, .json, .docx");                                                                            
        return;                                                                                                                                                 
      }                                                                                                                                                         

      const { cleanFiles, threats } = await scanUploadedFiles(validFiles);
      if (!cleanFiles.length) {
        setError(buildThreatWarning(threats));
        setScanState("threat");
        setScanMessage(buildThreatWarning(threats));
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
      }
      if (threats.length) {
        warnings.push(buildThreatWarning(threats));
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

      const { cleanFiles, threats } = await scanUploadedFiles(files);
      if (!cleanFiles.length) {
        const warning = buildThreatWarning(threats) || "Security scan failed.";
        setFiles([]);
        setError(warning);
        setScanState("threat");
        setScanMessage(warning);
        return;
      }

      setFiles(cleanFiles);
      if (threats.length) {
        setError(buildThreatWarning(threats));
        setScanMessage(`Scan complete. ${threats.length} unsafe file(s) were blocked.`);
      } else {
        setScanMessage("Scan complete. No threats detected.");
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
        return;
      }
                                                                                                                                                                
      setLoading(true);                                                                                                                                         
      setError("");                                                                                                                                             
                                                                                                                                                                
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
      } catch (err) {                                                                                                                                           
        console.error(err);                                                                                                                                     
        setError("Conversion failed");                                                                                                                          
      } finally {
        setLoading(false);                                                                                                                                      
      }                                                                                                                                                         
    };                                                                                                                                                          
                                                                                                                                                                
    return (                                                                                                                                                    
      <div style={{ maxWidth: 650, margin: "40px auto" }}>                                                                                                      
        <h1>Document to PDF</h1>                                                                                                                                
                                                                                                                                                                
        <input                                                                                                                                                  
          ref={fileInputRef}                                                                                                                                    
          type="file"                                                                                                                                           
          multiple                                                                                                                                              
          accept=".txt,.html,.json,.docx"                                                                                                                       
          onChange={handleFileChange}                                                                                                                           
          style={{ display: "none" }}                                                                                                                           
        />                                                                                                                                                      
                                                                                                                                                                
        <div                                                                                                                                                    
          onDrop={handleDrop}                                                                                                                                   
          onDragOver={(e) => {                                                                                                                                  
            e.preventDefault();                                                                                                                                 
            setIsDragging(true);                                                                                                                                
          }}                                                                                                                                                    
          onDragLeave={() => setIsDragging(false)}                                                                                                              
          onClick={() => fileInputRef.current?.click()}                                                                                                         
          style={{                                                                                                                                              
            marginTop: 20,                                                                                                                                      
            padding: 40,                                                                                                                                        
            border: isDragging ? "2px solid #4f46e5" : "2px dashed #6c63ff",                                                                                    
            borderRadius: 12,                                                                                                                                   
            textAlign: "center",                                                                                                                                
            cursor: "pointer",                                                                                                                                  
            background: isDragging ? "#eef2ff" : "#f6f7ff",                                                                                                     
            transition: "all 0.2s ease",                                                                                                                        
          }}
        >                                                                                                                                                       
          <p style={{ fontSize: 18 }}>                                                                                                                          
            {isDragging ? "Drop files here" : "Drop files here or click to upload"}                                                                             
          </p>                                                                                                                                                  
        </div>                                                                                                                                                  
                                                                                                                                                                
        {error && (                                                                                                                                             
          <p style={{ color: "red", marginTop: 10 }}>                                                                                                           
            {error}                                                                                                                                             
          </p>                                                                                                                                                  
        )}                                                                                                                                                      
        {scanMessage && (
          <p style={{ color: scanState === "clean" ? "green" : "#4b5563", marginTop: 10 }}>
            {scanMessage}
          </p>
        )}
                                                                                                                                                                
        {files.length > 0 && (                                                                                                                                  
          <>                                                                                                                                                    
            <div style={{ marginTop: 20, display: "grid", gap: 10 }}>                                                                                           
              {files.map((file, index) => (                                                                                                                     
                <div                                                                                                                                            
                  key={`${file.name}-${file.size}-${file.lastModified}`}                                                                                        
                  style={{                                                                                                                                      
                    padding: 12,                                                                                                                                
                    border: "1px solid #ddd",                                                                                                                   
                    borderRadius: 8,                                                                                                                            
                    display: "flex",
                    justifyContent: "space-between",                                                                                                            
                    background: "#fafafa",                                                                                                                      
                    gap: 12,                                                                                                                                    
                  }}                                                                                                                                            
                >                                                                                                                                               
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>                                                             
                                                                                                                                                                
                  <button                                                                                                                                       
                    onClick={() => handleRemoveFile(index)}                                                                                                     
                    style={{                                                                                                                                    
                      background: "#ff4d4f",                                                                                                                    
                      color: "white",                                                                                                                           
                      border: "none",                                                                                                                           
                      padding: "6px 12px",                                                                                                                      
                      borderRadius: 6,                                                                                                                          
                    }}                                                                                                                                          
                  >                                                                                                                                             
                    Remove                                                                                                                                      
                  </button>                                                                                                                                     
                </div>                                                                                                                                          
              ))}                                                                                                                                               
            </div>                                                                                                                                              
                                                                                                                                                                
            <button                                                                                                                                             
              onClick={clearSelection}                                                                                                                          
              style={{                                                                                                                                          
                marginTop: 12,                                                                                                                                  
                background: "transparent",                                                                                                                      
                color: "#374151",                                                                                                                               
                border: "1px solid #d1d5db",                                                                                                                    
                padding: "6px 12px",                                                                                                                            
                borderRadius: 6,                                                                                                                                
              }}                                                                                                                                                
            >                                                                                                                                                   
              Clear all                                                                                                                                         
            </button>                                                                                                                                           
          </>                                                                                                                                                   
        )}                                                                                                                                                      
                                                                                                                                                                
        <br />                                                                                                                                                  
                                                                                                                                                                
        <button                                                                                                                                             
          onClick={runScan}
          disabled={loading || files.length === 0 || scanState === "scanning"}
          style={{
            marginTop: 12,
            padding: "10px 24px",
            background: loading || files.length === 0 || scanState === "scanning" ? "#9ca3af" : "#fff",
            color: loading || files.length === 0 || scanState === "scanning" ? "white" : "#111827",
            border: "1px solid #111827",
            borderRadius: 8,
            cursor: loading || files.length === 0 || scanState === "scanning" ? "not-allowed" : "pointer",
          }}
        >
          {scanState === "scanning" ? "Scanning..." : "Scan Files"}
        </button>

        <button                                                                                                                                             
          onClick={handleConvert}                                                                                                                               
          disabled={loading || files.length === 0 || scanState !== "clean"}
          style={{                                                                                                                                              
            padding: "12px 24px",                                                                                                                               
            background: loading || files.length === 0 || scanState !== "clean" ? "#9ca3af" : "#6c63ff",
            color: "white",
            border: "none",                                                                                                                                     
            borderRadius: 8,                                                                                                                                    
            cursor: loading || files.length === 0 || scanState !== "clean" ? "not-allowed" : "pointer",
          }}                                                                                                                                                    
        >                                                                                                                                                       
          {loading ? "Converting..." : `Convert ${files.length} file(s) to PDF`}                                                                                
        </button>                                                                                                                                               
      </div>                                                                                                                                                    
    );                                                                                                                                                          
  }
