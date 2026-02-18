"use client";
                                                                                                                                                                
  import {                                                                                                                                                      
    ArrowLeft,                                                                                                                                                  
    Upload,                                                                                                                                                     
    FileText,                                                                                                                                                   
    Image as ImageIcon,                                                                                                                                         
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
  import { toolToast } from "@/lib/toolToasts";
                                                                                                                                                                
  import { saveToolState, clearToolState } from "@/lib/toolStateStorage";                                                                                       
                                                                                                                                                                
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

  const OUTPUT_ENCRYPTION_ENABLED_TOOLS = new Set([
    "jpeg-to-pdf",
    "png-to-pdf",
    "pdf-compress",
    "pdf-watermark",
    "pdf-redact",
    "pdf-delete-pages",
    "pdf-page-reorder",
    "pdf-password-remover",
    "pdf-page-numbers",
    "pdf-rotate",
  ]);
                                                                                                                                                                
  export default function ToolUploadPage() {                                                                                                                    
    const router = useRouter();                                                                                                                                 
    const params = useParams();                                                                                                                                 
                                                                                                                                                                
    const toolId = Array.isArray(params.id)                                                                                                                     
      ? params.id[0]                                                                                                                                            
      : (params.id as string);                                                                                                                                  
                                                                                                                                                                
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);                                                                                             
    const [previewIndex, setPreviewIndex] = useState(0);                                                                                                        
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);                                                                                          
    const [previewText, setPreviewText] = useState("");                                                                                                         
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);                                                                                            
    const [fileError, setFileError] = useState<string | null>(null);                                                                                            
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
    const [encryptOutput, setEncryptOutput] = useState(false);
    const [outputEncryptionPassword, setOutputEncryptionPassword] = useState("");
    const [deletePagesInput, setDeletePagesInput] = useState("");
    const [reorderPagesInput, setReorderPagesInput] = useState("");                                                                                             
    const [extractImageFormat, setExtractImageFormat] = useState<"png" | "jpg">(                                                                                
      "png",                                                                                                                                                    
    );                                                                                                                                                          
                                                                                                                                                                
    const [rotateConfig, setRotateConfig] = useState({ angle: 90, pages: "" });                                                                                 
    const [pageNumberFormat, setPageNumberFormat] = useState("numeric");
    const [pageNumberFontSize, setPageNumberFontSize] = useState(14);
    const supportsOutputEncryption = OUTPUT_ENCRYPTION_ENABLED_TOOLS.has(toolId);
                                                                                                                                                                
    const fileInputRef = useRef<HTMLInputElement | null>(null);                                                                                                 
                                                                                                                                                                
    useEffect(() => {                                                                                                                                           
      if (!toolId || !selectedFiles.length) return;                                                                                                             
                                                                                                                                                                
      const file = selectedFiles[0];
      saveToolState(toolId, {                                                                                                                                   
        fileMeta: { name: file.name, size: file.size, type: file.type },                                                                                        
      });
    }, [toolId, selectedFiles]);                                                                                                                                
                                                                                                                                                                
    useEffect(() => {                                                                                                                                           
      const file = selectedFiles[previewIndex];                                                                                                                 
      if (!file) {                                                                                                                                              
        setPreviewUrl(null);                                                                                                                                    
        setPreviewText("");                                                                                                                                     
        setIsPreviewLoading(false);                                                                                                                             
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      let disposed = false;                                                                                                                                     
      let objectUrl: string | null = null;                                                                                                                      
      const category = getFileCategory(file);                                                                                                                   
                                                                                                                                                                
      setIsPreviewLoading(true);                                                                                                                                
      setPreviewText("");                                                                                                                                       
      setPreviewUrl(null);                                                                                                                                      
                                                                                                                                                                
      const loadPreview = async () => {
        try {                                                                                                                                                   
          if (category === "pdf" || category === "image") {                                                                                                     
            objectUrl = URL.createObjectURL(file);                                                                                                              
            if (!disposed) setPreviewUrl(objectUrl);                                                                                                            
          } else if (category === "text") {                                                                                                                     
            const text = await file.text();                                                                                                                     
            if (!disposed) setPreviewText(text.slice(0, 8000));                                                                                                 
          }                                                                                                                                                     
        } finally {                                                                                                                                             
          if (!disposed) setIsPreviewLoading(false);                                                                                                            
        }                                                                                                                                                       
      };
                                                                                                                                                                
      loadPreview();                                                                                                                                            
                                                                                                                                                                
      return () => {                                                                                                                                            
        disposed = true;                                                                                                                                        
        if (objectUrl) URL.revokeObjectURL(objectUrl);                                                                                                          
      };                                                                                                                                                        
    }, [selectedFiles, previewIndex]);                                                                                                                          
                                                                                                                                                                
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
      if (!toolId) return;                                                                                                                                      
                                                                                                                                                                
      if (toolId === "pdf-compress") {                                                                                                                          
        const savedLevel = localStorage.getItem("compressionLevel");                                                                                            
        if (                                                                                                                                                    
          savedLevel === "low" ||                                                                                                                               
          savedLevel === "medium" ||                                                                                                                            
          savedLevel === "high"                                                                                                                                 
        ) {                                                                                                                                                     
          setCompressionLevel(savedLevel);                                                                                                                      
        }
                                                                                                                                                                
        const savedTarget =                                                                                                                                     
          localStorage.getItem("compressionTargetBytes") ||                                                                                                     
          localStorage.getItem("targetBytes") ||                                                                                                                
          "";                                                                                                                                                   
        setCompressionTargetBytesInput(savedTarget);                                                                                                            
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      if (toolId === "pdf-watermark") {                                                                                                                         
        setWatermarkText(localStorage.getItem("watermarkText") || "");                                                                                          
        setRotationAngle(Number(localStorage.getItem("watermarkRotation") || 45));                                                                              
        setOpacity(Number(localStorage.getItem("watermarkOpacity") || 40));                                                                                     
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      if (toolId === "pdf-delete-pages") {                                                                                                                      
        setDeletePagesInput(localStorage.getItem("pdfDeletePages") || "");                                                                                      
        return;                                                                                                                                                 
      }                                                                                                                                                         

      if (toolId === "pdf-page-reorder") {
        setReorderPagesInput(localStorage.getItem("pdfReorderPages") || "");                                                                                    
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      if (toolId === "pdf-extract-images") {                                                                                                                    
        const savedFormat = localStorage.getItem("pdfExtractImageFormat");                                                                                      
        setExtractImageFormat(savedFormat === "jpg" ? "jpg" : "png");                                                                                           
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      if (toolId === "pdf-page-numbers") {                                                                                                                      
        const savedFormat = localStorage.getItem("pageNumberFormat");                                                                                           
        if (                                                                                                                                                    
          savedFormat === "numeric" ||                                                                                                                          
          savedFormat === "Roman" ||                                                                                                                            
          savedFormat === "letter"                                                                                                                              
        ) {                                                                                                                                                     
          setPageNumberFormat(savedFormat);                                                                                                                     
        }                                                                                                                                                       
                                                                                                                                                                
        const savedFontSize = Number.parseInt(                                                                                                                  
          localStorage.getItem("pageNumberFontSize") || "14",                                                                                                   
          10,
        );                                                                                                                                                      
        if (Number.isFinite(savedFontSize) && savedFontSize > 0) {                                                                                              
          setPageNumberFontSize(savedFontSize);                                                                                                                 
        }                                                                                                                                                       
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      if (toolId === "pdf-rotate") {                                                                                                                            
        const rawConfig = localStorage.getItem("pdfRotateConfig");                                                                                              
        if (!rawConfig) return;                                                                                                                                 
        try {                                                                                                                                                   
          const parsed = JSON.parse(rawConfig) as { angle?: number; pages?: string };                                                                           
          const nextAngle =                                                                                                                                     
            parsed.angle === 90 || parsed.angle === 180 || parsed.angle === 270                                                                                 
              ? parsed.angle                                                                                                                                    
              : 90;                                                                                                                                             
          setRotateConfig({                                                                                                                                     
            angle: nextAngle,                                                                                                                                   
            pages: typeof parsed.pages === "string" ? parsed.pages : "",                                                                                        
          });                                                                                                                                                   
        } catch {                                                                                                                                               
          setRotateConfig({ angle: 90, pages: "" });                                                                                                            
        }                                                                                                                                                       
      }                                                                                                                                                         
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
                                                                                                                                                                
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      clearStoredFiles();
                                                                                                                                                                
      const files = Array.from(e.target.files || []);                                                                                                           
      if (!files.length) return;                                                                                                                                
                                                                                                                                                                
      const MAX_FILES = 10;
      if (files.length > MAX_FILES) {
        const message = `You can upload up to ${MAX_FILES} files.`;
        setFileError(message);
        toolToast.warning(message);
        return;
      }
                                                                                                                                                                
      const allowed = getSupportedTypes();                                                                                                                      
      const validFiles: File[] = [];                                                                                                                            
                                                                                                                                                                
      for (const file of files) {                                                                                                                               
        const ext = "." + file.name.split(".").pop()?.toLowerCase();                                                                                            
                                                                                                                                                                
        if (allowed.length && !allowed.includes(ext)) {
          const message = `Unsupported format: ${file.name}. Supported: ${allowed.join(", ")}.`;
          setFileError(message);
          toolToast.warning(message);
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          const message = `File is too large: ${file.name}. Max size is 10 MB.`;
          setFileError(message);
          toolToast.warning(message);
          return;
        }
                                                                                                                                                                
        validFiles.push(file);                                                                                                                                  
      }                                                                                                                                                         
                                                                                                                                                                
      setFileError(null);
      setSelectedFiles(validFiles);
      setHasUnsavedWork(true);
      toolToast.info(`${validFiles.length} file(s) ready to process.`);
    };

    const handleProcessFile = async () => {
      if (!selectedFiles.length) return;
      if (toolId === "pdf-protect" && !protectPassword.trim()) {
        const message = "Enter a password to continue.";
        setFileError(message);
        toolToast.warning(message);
        return;
      }
      if (toolId === "pdf-password-remover" && !passwordRemoverPassword.trim()) {
        const message = "Enter a password to continue.";
        setFileError(message);
        toolToast.warning(message);
        return;
      }
      if (toolId === "pdf-delete-pages" && !deletePagesInput.trim()) {
        const message = "Enter pages to delete.";
        setFileError(message);
        toolToast.warning(message);
        return;
      }
      if (toolId === "pdf-page-reorder" && !reorderPagesInput.trim()) {
        const message = "Enter page order.";
        setFileError(message);
        toolToast.warning(message);
        return;
      }
      if (toolId === "pdf-watermark" && !watermarkText.trim()) {
        const message = "Enter watermark text.";
        setFileError(message);
        toolToast.warning(message);
        return;
      }
      if (supportsOutputEncryption && encryptOutput && !outputEncryptionPassword.trim()) {
        const message = "Enter a password to encrypt output files.";
        setFileError(message);
        toolToast.warning(message);
        return;
      }
                                                                                                                                                                
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
                                                                                                                                                                
      if (toolId === "pdf-watermark") {                                                                                                                         
        localStorage.setItem("watermarkText", watermarkText.trim());                                                                                            
        localStorage.setItem("watermarkRotation", String(rotationAngle));                                                                                       
        localStorage.setItem("watermarkOpacity", String(opacity));                                                                                              
      }                                                                                                                                                         
                                                                                                                                                                
      if (toolId === "pdf-delete-pages") {                                                                                                                      
        localStorage.setItem("pdfDeletePages", deletePagesInput.trim());                                                                                        
      }                                                                                                                                                         
                                                                                                                                                                
      if (toolId === "pdf-page-reorder") {                                                                                                                      
        localStorage.setItem("pdfReorderPages", reorderPagesInput.trim());                                                                                      
      }                                                                                                                                                         
                                                                                                                                                                
      if (toolId === "pdf-extract-images") {                                                                                                                    
        localStorage.setItem("pdfExtractImageFormat", extractImageFormat);                                                                                      
      }                                                                                                                                                         
                                                                                                                                                                
      if (toolId === "pdf-page-numbers") {                                                                                                                      
        localStorage.setItem("pageNumberFormat", pageNumberFormat);                                                                                             
        localStorage.setItem("pageNumberFontSize", String(pageNumberFontSize));                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      if (toolId === "pdf-rotate") {                                                                                                                            
        localStorage.setItem("pdfRotateConfig", JSON.stringify(rotateConfig));                                                                                  
      }                                                                                                                                                         
                                                                                                                                                                
      setIsProcessing(true);
      toolToast.info("Processing started.");

      try {
        const storeOptions: {
          password?: string;
          encryptOutput?: boolean;
          outputPassword?: string;
        } = {};

        if (toolId === "pdf-protect") {
          storeOptions.password = protectPassword;
        } else if (toolId === "pdf-password-remover") {
          storeOptions.password = passwordRemoverPassword;
        }

        if (supportsOutputEncryption && encryptOutput) {
          storeOptions.encryptOutput = true;
          storeOptions.outputPassword = outputEncryptionPassword.trim();
        }

        const result = await storeFiles(
          selectedFiles,
          Object.keys(storeOptions).length ? storeOptions : undefined,
        );

        if (!result.ok) {
          const message = result.error || "Failed to process file.";
          setFileError(message);
          toolToast.error(message);
          return;
        }

        clearToolState(toolId);
        router.push(`/tool/${toolId}/processing`);
      } catch {
        const message = "Unexpected error occurred.";
        setFileError(message);
        toolToast.error(message);
      } finally {
        setIsProcessing(false);
      }
    };                                                                                                                                                          
                                                                                                                                                                
    const handleBackNavigation = () => {                                                                                                                        
      if (hasUnsavedWork) {                                                                                                                                     
        const confirmLeave = window.confirm("You have unsaved work. Leave anyway?");                                                                            
        if (!confirmLeave) return;                                                                                                                              
      }                                                                                                                                                         
      router.push("/dashboard");                                                                                                                                
    };                                                                                                                                                          
                                                                                                                                                                
    const canProcess =
      selectedFiles.length > 0 &&
      !isProcessing &&
      !(toolId === "pdf-protect" && !protectPassword.trim()) &&
      !(toolId === "pdf-delete-pages" && !deletePagesInput.trim()) &&
      !(toolId === "pdf-page-reorder" && !reorderPagesInput.trim()) &&
      !(toolId === "pdf-watermark" && !watermarkText.trim()) &&
      !(toolId === "pdf-password-remover" && !passwordRemoverPassword.trim()) &&
      !(supportsOutputEncryption && encryptOutput && !outputEncryptionPassword.trim());
                                                                                                                                                                
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
            <p className="text-muted-foreground mb-12">{categoryConfig.subtitle}</p>                                                                            
                                                                                                                                                                
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
                                                                                                                                                                
          {(toolId === "pdf-protect" || toolId === "pdf-password-remover") && (
            <div className="mt-6 rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium mb-2">Password</label>                                                                                
              <input                                                                                                                                            
                type="password"                                                                                                                                 
                value={                                                                                                                                         
                  toolId === "pdf-protect" ? protectPassword : passwordRemoverPassword                                                                          
                }                                                                                                                                               
                onChange={(e) =>                                                                                                                                
                  toolId === "pdf-protect"                                                                                                                      
                    ? setProtectPassword(e.target.value)                                                                                                        
                    : setPasswordRemoverPassword(e.target.value)                                                                                                
                }                                                                                                                                               
                placeholder="Enter password"                                                                                                                    
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"                                                                          
              />                                                                                                                                                
            </div>
          )}

          {supportsOutputEncryption && (
            <div className="mt-6 rounded-xl border border-gray-200 p-4 space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={encryptOutput}
                  onChange={(e) => setEncryptOutput(e.target.checked)}
                />
                Encrypt output PDF before download
              </label>
              {encryptOutput && (
                <div>
                  <input
                    type="password"
                    value={outputEncryptionPassword}
                    onChange={(e) => setOutputEncryptionPassword(e.target.value)}
                    placeholder="Set encryption password"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This password will be required to open downloaded PDF files.
                  </p>
                </div>
              )}
            </div>
          )}
                                                                                                                                                                
          {toolId === "pdf-watermark" && (                                                                                                                      
            <div className="mt-6 rounded-xl border border-gray-200 p-4 space-y-4">                                                                              
              <div>                                                                                                                                             
                <label className="block text-sm font-medium mb-2">
                  Watermark Text                                                                                                                                
                </label>                                                                                                                                        
                <input                                                                                                                                          
                  type="text"                                                                                                                                   
                  value={watermarkText}                                                                                                                         
                  onChange={(e) => setWatermarkText(e.target.value)}                                                                                            
                  placeholder="Confidential"                                                                                                                    
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"                                                                        
                />                                                                                                                                              
              </div>                                                                                                                                            
              <div>                                                                                                                                             
                <label className="block text-sm font-medium mb-2">                                                                                              
                  Rotation ({rotationAngle} degrees)                                                                                                            
                </label>                                                                                                                                        
                <input                                                                                                                                          
                  type="range"                                                                                                                                  
                  min={-180}                                                                                                                                    
                  max={180}                                                                                                                                     
                  step={1}                                                                                                                                      
                  value={rotationAngle}                                                                                                                         
                  onChange={(e) => setRotationAngle(Number(e.target.value))}
                  className="w-full"                                                                                                                            
                />                                                                                                                                              
              </div>                                                                                                                                            
              <div>                                                                                                                                             
                <label className="block text-sm font-medium mb-2">                                                                                              
                  Opacity ({opacity}%)                                                                                                                          
                </label>                                                                                                                                        
                <input                                                                                                                                          
                  type="range"                                                                                                                                  
                  min={5}                                                                                                                                       
                  max={100}                                                                                                                                     
                  step={1}                                                                                                                                      
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}                                                                                          
                  className="w-full"                                                                                                                            
                />                                                                                                                                              
              </div>                                                                                                                                            
            </div>                                                                                                                                              
          )}                                                                                                                                                    
                                                                                                                                                                
          {toolId === "pdf-delete-pages" && (                                                                                                                   
            <div className="mt-6 rounded-xl border border-gray-200 p-4">                                                                                        
              <label className="block text-sm font-medium mb-2">Pages to Delete</label>                                                                         
              <input                                                                                                                                            
                type="text"                                                                                                                                     
                value={deletePagesInput}                                                                                                                        
                onChange={(e) => setDeletePagesInput(e.target.value)}                                                                                           
                placeholder="e.g. 2,4-6"                                                                                                                        
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"                                                                          
              />
              <p className="mt-1 text-xs text-gray-500">                                                                                                        
                Use comma-separated pages or ranges.                                                                                                            
              </p>                                                                                                                                              
            </div>                                                                                                                                              
          )}                                                                                                                                                    
                                                                                                                                                                
          {toolId === "pdf-page-reorder" && (                                                                                                                   
            <div className="mt-6 rounded-xl border border-gray-200 p-4">                                                                                        
              <label className="block text-sm font-medium mb-2">New Page Order</label>                                                                          
              <input                                                                                                                                            
                type="text"                                                                                                                                     
                value={reorderPagesInput}                                                                                                                       
                onChange={(e) => setReorderPagesInput(e.target.value)}                                                                                          
                placeholder="e.g. 3,1,2"                                                                                                                        
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"                                                                          
              />                                                                                                                                                
              <p className="mt-1 text-xs text-gray-500">Provide each page exactly once.</p>                                                                     
            </div>                                                                                                                                              
          )}                                                                                                                                                    
                                                                                                                                                                
          {toolId === "pdf-extract-images" && (                                                                                                                 
            <div className="mt-6 rounded-xl border border-gray-200 p-4">                                                                                        
              <label className="block text-sm font-medium mb-2">Export Format</label>                                                                           
              <select                                                                                                                                           
                value={extractImageFormat}                                                                                                                      
                onChange={(e) =>                                                                                                                                
                  setExtractImageFormat(e.target.value === "jpg" ? "jpg" : "png")                                                                               
                }                                                                                                                                               
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"                                                                          
              >                                                                                                                                                 
                <option value="png">PNG</option>                                                                                                                
                <option value="jpg">JPG</option>                                                                                                                
              </select>                                                                                                                                         
            </div>                                                                                                                                              
          )}                                                                                                                                                    
                                                                                                                                                                
          {toolId === "pdf-page-numbers" && (                                                                                                                   
            <div className="mt-6 rounded-xl border border-gray-200 p-4 space-y-4">                                                                              
              <div>                                                                                                                                             
                <label className="block text-sm font-medium mb-2">Number Format</label>                                                                         
                <select                                                                                                                                         
                  value={pageNumberFormat}                                                                                                                      
                  onChange={(e) => setPageNumberFormat(e.target.value)}                                                                                         
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"                                                                        
                >                                                                                                                                               
                  <option value="numeric">1, 2, 3</option>                                                                                                      
                  <option value="Roman">I, II, III</option>                                                                                                     
                  <option value="letter">A, B, C</option>                                                                                                       
                </select>                                                                                                                                       
              </div>
              <div>                                                                                                                                             
                <label className="block text-sm font-medium mb-2">Font Size</label>                                                                             
                <input                                                                                                                                          
                  type="number"                                                                                                                                 
                  min={8}                                                                                                                                       
                  max={72}                                                                                                                                      
                  value={pageNumberFontSize}                                                                                                                    
                  onChange={(e) => {                                                                                                                            
                    const next = Number.parseInt(e.target.value, 10);                                                                                           
                    if (Number.isFinite(next)) {                                                                                                                
                      setPageNumberFontSize(Math.min(72, Math.max(8, next)));                                                                                   
                    }                                                                                                                                           
                  }}                                                                                                                                            
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"                                                                        
                />                                                                                                                                              
              </div>
            </div>                                                                                                                                              
          )}                                                                                                                                                    
                                                                                                                                                                
          {toolId === "pdf-rotate" && (                                                                                                                         
            <div className="mt-6 rounded-xl border border-gray-200 p-4 space-y-4">                                                                              
              <div>                                                                                                                                             
                <label className="block text-sm font-medium mb-2">Rotation Angle</label>                                                                        
                <select                                                                                                                                         
                  value={String(rotateConfig.angle)}                                                                                                            
                  onChange={(e) =>                                                                                                                              
                    setRotateConfig((prev) => ({                                                                                                                
                      ...prev,                                                                                                                                  
                      angle: Number(e.target.value),                                                                                                            
                    }))
                  }                                                                                                                                             
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"                                                                        
                >                                                                                                                                               
                  <option value="90">90 degrees</option>                                                                                                        
                  <option value="180">180 degrees</option>                                                                                                      
                  <option value="270">270 degrees</option>                                                                                                      
                </select>                                                                                                                                       
              </div>                                                                                                                                            
              <div>                                                                                                                                             
                <label className="block text-sm font-medium mb-2">                                                                                              
                  Pages to Rotate (Optional)                                                                                                                    
                </label>                                                                                                                                        
                <input                                                                                                                                          
                  type="text"                                                                                                                                   
                  value={rotateConfig.pages}                                                                                                                    
                  onChange={(e) =>                                                                                                                              
                    setRotateConfig((prev) => ({ ...prev, pages: e.target.value }))                                                                             
                  }                                                                                                                                             
                  placeholder="Leave blank for all pages (e.g. 1,3-5)"                                                                                          
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"                                                                        
                />                                                                                                                                              
              </div>                                                                                                                                            
            </div>                                                                                                                                              
          )}                                                                                                                                                    
                                                                                                                                                                
          {selectedFiles.length > 0 && (                                                                                                                        
            <div className="mt-8 rounded-xl border border-gray-200 p-4 space-y-4">                                                                              
              <div className="flex items-center justify-between">                                                                                               
                <h2 className="text-lg font-semibold">File Preview</h2>                                                                                         
                <button                                                                                                                                         
                  type="button"                                                                                                                                 
                  onClick={handleCancelSelection}                                                                                                               
                  className="text-sm text-gray-600 hover:text-black"                                                                                            
                >                                                                                                                                               
                  Cancel                                                                                                                                        
                </button>                                                                                                                                       
              </div>                                                                                                                                            
                                                                                                                                                                
              <div className="space-y-2">                                                                                                                       
                {selectedFiles.map((file, index) => (                                                                                                           
                  <div                                                                                                                                          
                    key={`${file.name}-${file.size}-${file.lastModified}`}                                                                                      
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 ${                                                                
                      index === previewIndex ? "border-black bg-gray-50" : "border-gray-200"                                                                    
                    }`}                                                                                                                                         
                  >                                                                                                                                             
                    <button                                                                                                                                     
                      type="button"                                                                                                                             
                      onClick={() => setPreviewIndex(index)}                                                                                                    
                      className="text-left min-w-0 flex-1"                                                                                                      
                    >                                                                                                                                           
                      <p className="truncate text-sm font-medium">{file.name}</p>                                                                               
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>                                                                      
                    </button>                                                                                                                                   
                    <button                                                                                                                                     
                      type="button"                                                                                                                             
                      onClick={() => handleRemoveFile(index)}                                                                                                   
                      className="ml-3 text-xs text-red-600 hover:text-red-700"                                                                                  
                    >                                                                                                                                           
                      Remove                                                                                                                                    
                    </button>                                                                                                                                   
                  </div>                                                                                                                                        
                ))}                                                                                                                                             
              </div>                                                                                                                                            
                                                                                                                                                                
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">                                                                      
                {isPreviewLoading ? (                                                                                                                           
                  <div className="p-6 text-sm text-gray-600">Loading preview...</div>                                                                           
                ) : selectedFiles[previewIndex] &&                                                                                                              
                  getFileCategory(selectedFiles[previewIndex]) === "pdf" &&                                                                                     
                  previewUrl ? (                                                                                                                                
                  <iframe src={previewUrl} title="PDF preview" className="w-full h-[420px]" />                                                                  
                ) : selectedFiles[previewIndex] &&                                                                                                              
                  getFileCategory(selectedFiles[previewIndex]) === "image" &&                                                                                   
                  previewUrl ? (                                                                                                                                
                  <div className="p-4 flex justify-center bg-gray-50">                                                                                          
                    <img                                                                                                                                        
                      src={previewUrl}                                                                                                                          
                      alt="Selected file preview"                                                                                                               
                      className="max-h-[420px] w-auto object-contain"                                                                                           
                    />                                                                                                                                          
                  </div>                                                                                                                                        
                ) : selectedFiles[previewIndex] &&                                                                                                              
                  getFileCategory(selectedFiles[previewIndex]) === "text" ? (                                                                                   
                  <pre className="p-4 text-xs whitespace-pre-wrap break-words max-h-[420px] overflow-auto">                                                     
                    {previewText || "No text content available."}                                                                                               
                  </pre>                                                                                                                                        
                ) : (                                                                                                                                           
                  <div className="p-6 text-sm text-gray-600">                                                                                                   
                    Preview is not available for this file type.                                                                                                
                  </div>                                                                                                                                        
                )}                                                                                                                                              
              </div>                                                                                                                                            
                                                                                                                                                                
              <p className="text-xs text-gray-500">                                                                                                             
                Verify your files before processing. You can replace, remove, or cancel.                                                                        
              </p>                                                                                                                                              
                                                                                                                                                                
              {fileError && <p className="text-sm text-red-600">{fileError}</p>}                                                                                
                                                                                                                                                                
              <div className="flex flex-col gap-3 sm:flex-row">                                                                                                 
                <button                                                                                                                                         
                  type="button"                                                                                                                                 
                  onClick={() => fileInputRef.current?.click()}                                                                                                 
                  className="w-full sm:w-auto py-3 px-4 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50"                                 
                >                                                                                                                                               
                  Replace File                                                                                                                                  
                </button>                                                                                                                                       
                <button                                                                                                                                         
                  type="button"                                                                                                                                 
                  onClick={handleProcessFile}                                                                                                                   
                  disabled={!canProcess}                                                                                                                        
                  className={`w-full sm:flex-1 py-3 rounded-lg text-sm font-medium transition ${                                                                
                    canProcess                                                                                                                                  
                      ? "bg-black text-white hover:bg-gray-800"                                                                                                 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"                                                                                          
                  }`}                                                                                                                                           
                >                                                                                                                                               
                  {isProcessing ? "Processing..." : "Confirm & Continue"}                                                                                       
                </button>                                                                                                                                       
              </div>                                                                                                                                            
            </div>                                                                                                                                              
          )}                                                                                                                                                    
                                                                                                                                                                
          {!selectedFiles.length && fileError && (                                                                                                              
            <p className="mt-3 text-sm text-red-600">{fileError}</p>                                                                                            
          )}                                                                                                                                                    
        </main>                                                                                                                                                 
      </div>                                                                                                                                                    
    );                                                                                                                                                          
  } 
