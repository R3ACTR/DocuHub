'use client';
                                                                                                                                                                
  import { useState, useEffect } from 'react';                                                                                                                  
  import { PDFDocument, PDFPage } from 'pdf-lib';                                                                                                               
  import {                                                                                                                                                      
    DndContext,                                                                                                                                                 
    closestCenter,                                                                                                                                              
    KeyboardSensor,                                                                                                                                             
    PointerSensor,                                                                                                                                              
    useSensor,                                                                                                                                                  
    useSensors,                                                                                                                                                 
    DragEndEvent,                                                                                                                                               
  } from '@dnd-kit/core';                                                                                                                                       
  import {                                                                                                                                                      
    arrayMove,                                                                                                                                                  
    SortableContext,                                                                                                                                            
    sortableKeyboardCoordinates,                                                                                                                                
    verticalListSortingStrategy,                                                                                                                                
  } from '@dnd-kit/sortable';                                                                                                                                   
  import { restrictToVerticalAxis } from '@dnd-kit/modifiers';                                                                                                  
  import { SortablePdfItem } from '@/components/SortablePdfItem';                                                                                               
  import {                                                                                                                                                      
    FileUp,                                                                                                                                                     
    Trash2,                                                                                                                                                     
    Combine,                                                                                                                                                    
    FileText,                                                                                                                                                   
    Loader2,                                                                                                                                                    
    Download,                                                                                                                                                   
    Printer,                                                                                                                                                    
  } from 'lucide-react';                                                                                                                                        
  import { buildThreatWarning, scanUploadedFiles } from '@/lib/security/virusScan';                                                                             
  import { toolToast } from '@/lib/toolToasts';                                                                                                                 
                                                                                                                                                                
  interface FileWithId {                                                                                                                                        
    id: string;                                                                                                                                                 
    file: File;                                                                                                                                                 
    uploadedAt: number;                                                                                                                                         
  }                                                                                                                                                             
                                                                                                                                                                
  export default function PdfMergePage() {                                                                                                                      
    const [filesWithIds, setFilesWithIds] = useState<FileWithId[]>([]);                                                                                         
    const [loading, setLoading] = useState(false);                                                                                                              
    const [uploadProgress, setUploadProgress] = useState(0);                                                                                                    
    const [isDraggingOver, setIsDraggingOver] = useState(false);                                                                                                
    const [mergedPdfUrl, setMergedPdfUrl] = useState('');                                                                                                       
    const [securityWarning, setSecurityWarning] = useState('');                                                                                                 
    const [scanState, setScanState] = useState<'idle' | 'scanning' | 'clean' | 'threat'>('idle');                                                               
    const [scanMessage, setScanMessage] = useState('');                                                                                                         
    const [, forceUpdate] = useState(0);                                                                                                                        
                                                                                                                                                                
    const getRelativeTime = (timestamp: number) => {                                                                                                            
      const diff = Date.now() - timestamp;                                                                                                                      
      const sec = Math.floor(diff / 1000);                                                                                                                      
                                                                                                                                                                
      if (sec < 5) return 'Uploaded just now';                                                                                                                  
      if (sec < 60) return `Uploaded ${sec}s ago`;                                                                                                              
                                                                                                                                                                
      const min = Math.floor(sec / 60);                                                                                                                         
      if (min < 60) return `Uploaded ${min} min ago`;                                                                                                           
                                                                                                                                                                
      const hr = Math.floor(min / 60);                                                                                                                          
      return `Uploaded ${hr} hr ago`;                                                                                                                           
    };                                                                                                                                                          
                                                                                                                                                                
    useEffect(() => {                                                                                                                                           
      const interval = setInterval(() => {                                                                                                                      
        forceUpdate((n) => n + 1);                                                                                                                              
      }, 30000);                                                                                                                                                
      return () => clearInterval(interval);                                                                                                                     
    }, []);                                                                                                                                                     
                                                                                                                                                                
    useEffect(() => {                                                                                                                                           
      return () => {                                                                                                                                            
        if (mergedPdfUrl) {                                                                                                                                     
          URL.revokeObjectURL(mergedPdfUrl);                                                                                                                    
        }                                                                                                                                                       
      };                                                                                                                                                        
    }, [mergedPdfUrl]);                                                                                                                                         
                                                                                                                                                                
    const replaceFile = async (idToReplace: string, newFile: File) => {                                                                                         
      if (newFile.type !== 'application/pdf') {                                                                                                                 
        toolToast.warning('Unsupported format. Please upload PDF files only.');                                                                                 
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      const { cleanFiles, threats } = await scanUploadedFiles([newFile]);                                                                                       
      if (!cleanFiles.length) {                                                                                                                                 
        const warning = buildThreatWarning(threats) || 'Replacement file was blocked.';                                                                         
        setSecurityWarning(warning);                                                                                                                            
        setScanState('threat');                                                                                                                                 
        setScanMessage(warning);                                                                                                                                
        toolToast.error('Replacement file was blocked by security scan.');                                                                                      
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      setFilesWithIds((prev) =>                                                                                                                                 
        prev.map((item) =>                                                                                                                                      
          item.id === idToReplace                                                                                                                               
            ? { ...item, file: cleanFiles[0], uploadedAt: Date.now() }                                                                                          
            : item                                                                                                                                              
        )                                                                                                                                                       
      );                                                                                                                                                        
                                                                                                                                                                
      setSecurityWarning(threats.length ? buildThreatWarning(threats) : '');                                                                                    
      setScanState('idle');                                                                                                                                     
      setScanMessage('Click "Scan Files" before merging.');                                                                                                     
    };                                                                                                                                                          
                                                                                                                                                                
    const sensors = useSensors(                                                                                                                                 
      useSensor(PointerSensor),                                                                                                                                 
      useSensor(KeyboardSensor, {                                                                                                                               
        coordinateGetter: sortableKeyboardCoordinates,                                                                                                          
      })                                                                                                                                                        
    );                                                                                                                                                          
                                                                                                                                                                
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {                                                                                            
      e.preventDefault();                                                                                                                                       
      setIsDraggingOver(true);                                                                                                                                  
    };                                                                                                                                                          
                                                                                                                                                                
    const handleDragLeave = () => setIsDraggingOver(false);                                                                                                     
                                                                                                                                                                
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {                                                                                          
      e.preventDefault();                                                                                                                                       
      setIsDraggingOver(false);                                                                                                                                 
                                                                                                                                                                
      const droppedFiles = Array.from(e.dataTransfer.files).filter(                                                                                             
        (file) => file.type === 'application/pdf'                                                                                                               
      );                                                                                                                                                        

      if (droppedFiles.length === 0) {                                                                                                                          
        toolToast.warning('Unsupported format. Please upload PDF files only.');                                                                                 
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      const { cleanFiles, threats } = await scanUploadedFiles(droppedFiles);                                                                                    
      if (!cleanFiles.length) {                                                                                                                                 
        const warning = buildThreatWarning(threats);                                                                                                            
        setSecurityWarning(warning);                                                                                                                            
        setScanState('threat');                                                                                                                                 
        setScanMessage(warning);                                                                                                                                
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      const newFiles = cleanFiles.map((file) => ({                                                                                                              
        id: Math.random().toString(36).substr(2, 9),                                                                                                            
        file,                                                                                                                                                   
        uploadedAt: Date.now(),                                                                                                                                 
      }));                                                                                                                                                      
                                                                                                                                                                
      setFilesWithIds((prev) => [...prev, ...newFiles]);                                                                                                        
      setSecurityWarning(threats.length ? buildThreatWarning(threats) : '');                                                                                    
      setScanState('idle');                                                                                                                                     
      setScanMessage('Click "Scan Files" before merging.');                                                                                                     
    };                                                                                                                                                          
                                                                                                                                                                
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {                                                                                
      if (!e.target.files) return;
      const picked = Array.from(e.target.files);                                                                                                                
      const selectedFiles = picked.filter((file) => file.type === 'application/pdf');                                                                           
      const skipped = picked.length - selectedFiles.length;                                                                                                     
                                                                                                                                                                
      if (skipped > 0) {                                                                                                                                        
        toolToast.warning('Some files were skipped. PDF format is supported.');                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      if (!selectedFiles.length) {                                                                                                                              
        e.target.value = '';                                                                                                                                    
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      const { cleanFiles, threats } = await scanUploadedFiles(selectedFiles);                                                                                   
      if (!cleanFiles.length) {                                                                                                                                 
        const warning = buildThreatWarning(threats);                                                                                                            
        setSecurityWarning(warning);                                                                                                                            
        setScanState('threat');                                                                                                                                 
        setScanMessage(warning);                                                                                                                                
        e.target.value = '';                                                                                                                                    
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      const newFiles = cleanFiles.map((file) => ({                                                                                                              
        id: Math.random().toString(36).substr(2, 9),                                                                                                            
        file,                                                                                                                                                   
        uploadedAt: Date.now(),                                                                                                                                 
      }));                                                                                                                                                      
                                                                                                                                                                
      setFilesWithIds((prev) => [...prev, ...newFiles]);                                                                                                        
      setSecurityWarning(threats.length ? buildThreatWarning(threats) : '');                                                                                    
      setScanState('idle');                                                                                                                                     
      setScanMessage('Click "Scan Files" before merging.');                                                                                                     
      e.target.value = '';                                                                                                                                      
    };                                                                                                                                                          
                                                                                                                                                                
    const runScan = async () => {                                                                                                                               
      if (!filesWithIds.length) return;                                                                                                                         
                                                                                                                                                                
      setScanState('scanning');                                                                                                                                 
      setScanMessage('Scanning files...');                                                                                                                      
      setSecurityWarning('');                                                                                                                                   
      toolToast.info('Scanning files...');                                                                                                                      
                                                                                                                                                                
      const scanResults = await Promise.all(                                                                                                                    
        filesWithIds.map(async (item) => {                                                                                                                      
          const { cleanFiles, threats } = await scanUploadedFiles([item.file]);                                                                                 
          return { item, isClean: cleanFiles.length > 0, threats };                                                                                             
        })                                                                                                                                                      
      );                                                                                                                                                        
                                                                                                                                                                
      const cleanItems = scanResults.filter((result) => result.isClean).map((result) => result.item);                                                           
      const threats = scanResults.flatMap((result) => result.threats);                                                                                          
                                                                                                                                                                
      if (!cleanItems.length) {                                                                                                                                 
        setFilesWithIds([]);                                                                                                                                    
        const warning = buildThreatWarning(threats) || 'Security scan failed.';                                                                                 
        setSecurityWarning(warning);                                                                                                                            
        setScanState('threat');                                                                                                                                 
        setScanMessage(warning);                                                                                                                                
        toolToast.error('Scan failed. No safe files available.');                                                                                               
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      if (cleanItems.length !== filesWithIds.length) {                                                                                                          
        setFilesWithIds(cleanItems);                                                                                                                            
      }                                                                                                                                                         
                                                                                                                                                                
      if (threats.length) {                                                                                                                                     
        const warning = buildThreatWarning(threats);                                                                                                            
        setSecurityWarning(warning);                                                                                                                            
        setScanMessage(`Scan complete. ${threats.length} unsafe file(s) were blocked.`);                                                                        
        toolToast.warning(`${threats.length} unsafe file(s) were blocked.`);                                                                                    
      } else {                                                                                                                                                  
        setScanMessage('Scan complete. No threats detected.');                                                                                                  
        toolToast.success('Scan complete. No threats detected.');                                                                                               
      }                                                                                                                                                         
      setScanState('clean');                                                                                                                                    
    };                                                                                                                                                          
                                                                                                                                                                
    const removeFile = (idToRemove: string) => {                                                                                                                
      setFilesWithIds((prev) => prev.filter((item) => item.id !== idToRemove));                                                                                 
      setSecurityWarning('');                                                                                                                                   
      setScanState('idle');                                                                                                                                     
      setScanMessage('Click "Scan Files" before merging.');                                                                                                     
    };                                                                                                                                                          
                                                                                                                                                                
    const clearAll = () => {                                                                                                                                    
      const confirmClear = window.confirm(                                                                                                                      
        'Are you sure you want to remove all uploaded files?'                                                                                                   
      );                                                                                                                                                        
                                                                                                                                                                
      if (confirmClear) {                                                                                                                                       
        setFilesWithIds([]);                                                                                                                                    
        setScanState('idle');                                                                                                                                   
        setScanMessage('');                                                                                                                                     
        setSecurityWarning('');                                                                                                                                 
      }                                                                                                                                                         
    };                                                                                                                                                          
                                                                                                                                                                
    const handleDragEnd = (event: DragEndEvent) => {                                                                                                            
      const { active, over } = event;                                                                                                                           
                                                                                                                                                                
      if (over && active.id !== over.id) {                                                                                                                      
        setFilesWithIds((items) => {                                                                                                                            
          const oldIndex = items.findIndex((i) => i.id === active.id);                                                                                          
          const newIndex = items.findIndex((i) => i.id === over.id);                                                                                            
          return arrayMove(items, oldIndex, newIndex);                                                                                                          
        });                                                                                                                                                     
        setScanState('idle');                                                                                                                                   
        setScanMessage('Click "Scan Files" before merging.');                                                                                                   
      }                                                                                                                                                         
    };                                                                                                                                                          
                                                                                                                                                                
    const handleDownloadMerged = () => {                                                                                                                        
      if (!mergedPdfUrl) return;                                                                                                                                
                                                                                                                                                                
      const a = document.createElement('a');                                                                                                                    
      a.href = mergedPdfUrl;                                                                                                                                    
      a.download = 'merged.pdf';                                                                                                                                
      a.click();                                                                                                                                                
    };                                                                                                                                                          
                                                                                                                                                                
    const handlePrintMerged = () => {                                                                                                                           
      if (!mergedPdfUrl) return;                                                                                                                                
                                                                                                                                                                
      const iframe = document.createElement('iframe');                                                                                                          
      iframe.style.position = 'fixed';                                                                                                                          
      iframe.style.right = '0';                                                                                                                                 
      iframe.style.bottom = '0';                                                                                                                                
      iframe.style.width = '0';                                                                                                                                 
      iframe.style.height = '0';                                                                                                                                
      iframe.style.border = '0';                                                                                                                                
      iframe.src = mergedPdfUrl;                                                                                                                                
                                                                                                                                                                
      iframe.onload = () => {                                                                                                                                   
        const frameWindow = iframe.contentWindow;                                                                                                               
        if (!frameWindow) return;                                                                                                                               
        frameWindow.focus();                                                                                                                                    
        frameWindow.print();                                                                                                                                    
      };                                                                                                                                                        
                                                                                                                                                                
      document.body.appendChild(iframe);                                                                                                                        
      setTimeout(() => {                                                                                                                                        
        document.body.removeChild(iframe);                                                                                                                      
      }, 5000);                                                                                                                                                 
    };                                                                                                                                                          
                                                                                                                                                                
    const handleMerge = async () => {                                                                                                                           
      if (scanState !== 'clean') {                                                                                                                              
        toolToast.warning('Please click "Scan Files" and wait for a clean result.');                                                                            
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      if (filesWithIds.length < 2) {
        toolToast.warning('Please select at least 2 PDF files.');                                                                                               
        return;                                                                                                                                                 
      }                                                                                                                                                         
                                                                                                                                                                
      setLoading(true);                                                                                                                                         
      setUploadProgress(10);                                                                                                                                    
      toolToast.info('Merging PDFs...');                                                                                                                        
                                                                                                                                                                
      try {                                                                                                                                                     
        const mergedPdf = await PDFDocument.create();                                                                                                           
        let processed = 0;
                                                                                                                                                                
        for (const item of filesWithIds) {                                                                                                                      
          const bytes = await item.file.arrayBuffer();                                                                                                          
          const pdf = await PDFDocument.load(bytes);                                                                                                            
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());                                                                                   
          pages.forEach((page: PDFPage) => mergedPdf.addPage(page));                                                                                            
                                                                                                                                                                
          processed++;                                                                                                                                          
          setUploadProgress(10 + (processed / filesWithIds.length) * 80);                                                                                       
        }                                                                                                                                                       
                                                                                                                                                                
        const mergedBytes = await mergedPdf.save();                                                                                                             
        setUploadProgress(95);                                                                                                                                  
                                                                                                                                                                
        const blob = new Blob([new Uint8Array(mergedBytes)], {                                                                                                  
          type: 'application/pdf',                                                                                                                              
        });                                                                                                                                                     
                                                                                                                                                                
        const url = URL.createObjectURL(blob);                                                                                                                  
        if (mergedPdfUrl) {                                                                                                                                     
          URL.revokeObjectURL(mergedPdfUrl);                                                                                                                    
        }                                                                                                                                                       
        setMergedPdfUrl(url);                                                                                                                                   
                                                                                                                                                                
        const a = document.createElement('a');                                                                                                                  
        a.href = url;                                                                                                                                           
        a.download = 'merged.pdf';                                                                                                                              
        a.click();                                                                                                                                              
                                                                                                                                                                
        setUploadProgress(100);                                                                                                                                 
        toolToast.success('File is ready for download.');                                                                                                       
      } catch (err) {                                                                                                                                           
        console.error(err);                                                                                                                                     
        toolToast.error('Processing failed. Could not merge PDFs.');                                                                                            
      } finally {                                                                                                                                               
        setTimeout(() => {                                                                                                                                      
          setLoading(false);                                                                                                                                    
          setUploadProgress(0);                                                                                                                                 
        }, 600);                                                                                                                                                
      }                                                                                                                                                         
    };                                                                                                                                                          
                                                                                                                                                                
    return (                                                                                                                                                    
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">                                                                                            
        <input                                                                                                                                                  
          type="file"                                                                                                                                           
          accept="application/pdf"                                                                                                                              
          id="replace-file-input"                                                                                                                               
          className="hidden"                                                                                                                                    
          onChange={(e) => {                                                                                                                                    
            const file = e.target.files?.[0];                                                                                                                   
            const id = e.currentTarget.getAttribute('data-replace-id');                                                                                         
            if (file && id) {                                                                                                                                   
              void replaceFile(id, file);                                                                                                                       
            }                                                                                                                                                   
            e.currentTarget.value = '';                                                                                                                         
          }}                                                                                                                                                    
        />                                                                                                                                                      
                                                                                                                                                                
        <div className="text-center mb-10">                                                                                                                     
          <div className="inline-flex items-center justify-center p-3 bg-accent/15 rounded-2xl text-accent mb-4">                                               
            <Combine className="w-8 h-8" />                                                                                                                     
          </div>                                                                                                                                                
          <h1 className="text-3xl font-bold text-foreground">Merge PDF Files</h1>                                                                               
          {securityWarning && (                                                                                                                                 
            <p className="mt-3 text-sm text-danger">{securityWarning}</p>                                                                                       
          )}                                                                                                                                                    
          {scanMessage && (                                                                                                                                     
            <p                                                                                                                                                  
              className={`mt-2 text-sm ${                                                                                                                       
                scanState === 'clean' ? 'text-green-700' : 'text-muted-foreground'                                                                              
              }`}                                                                                                                                               
            >                                                                                                                                                   
              {scanMessage}                                                                                                                                     
            </p>                                                                                                                                                
          )}                                                                                                                                                    
        </div>                                                                                                                                                  
                                                                                                                                                                
        <div                                                                                                                                                    
          tabIndex={0}                                                                                                                                          
          onDragOver={handleDragOver}                                                                                                                           
          onDragLeave={handleDragLeave}                                                                                                                         
          onDrop={handleDrop}                                                                                                                                   
          className={`relative border-2 border-dashed rounded-3xl p-12 text-center ${                                                                           
            isDraggingOver ? 'border-accent bg-accent/10' : 'border-border'                                                                                     
          }`}                                                                                                                                                   
        >                                                                                                                                                       
          <input                                                                                                                                                
            type="file"                                                                                                                                         
            accept="application/pdf"                                                                                                                            
            multiple                                                                                                                                            
            onChange={handleFileChange}                                                                                                                         
            className="absolute inset-0 w-full h-full opacity-0"                                                                                                
          />                                                                                                                                                    
                                                                                                                                                                
          <FileUp className="mx-auto mb-4 text-muted-foreground" />                                                                                             
          <p>Select or drop PDF files</p>                                                                                                                       
        </div>                                                                                                                                                  
                                                                                                                                                                
        {filesWithIds.length > 0 && (                                                                                                                           
          <div className="mt-12 space-y-6">                                                                                                                     
            <div className="flex items-center justify-between">                                                                                                 
              <div className="flex items-center gap-2">                                                                                                         
                <FileText className="w-5 h-5 text-accent" />                                                                                                    
                <h2 className="text-xl font-bold text-foreground">                                                                                              
                  {filesWithIds.length} files selected                                                                                                          
                </h2>                                                                                                                                           
              </div>                                                                                                                                            
                                                                                                                                                                
              <button                                                                                                                                           
                type="button"                                                                                                                                   
                onClick={(e) => {                                                                                                                               
                  e.preventDefault();                                                                                                                           
                  e.stopPropagation();                                                                                                                          
                  clearAll();                                                                                                                                   
                }}                                                                                                                                              
                className="flex items-center gap-2 px-3 py-1 text-danger hover:bg-danger/10 rounded-lg"                                                         
              >                                                                                                                                                 
                <Trash2 className="w-4 h-4" />                                                                                                                  
                Clear All                                                                                                                                       
              </button>                                                                                                                                         
            </div>                                                                                                                                              
                                                                                                                                                                
            <DndContext                                                                                                                                         
              sensors={sensors}                                                                                                                                 
              collisionDetection={closestCenter}                                                                                                                
              onDragEnd={handleDragEnd}                                                                                                                         
              modifiers={[restrictToVerticalAxis]}                                                                                                              
            >                                                                                                                                                   
              <SortableContext                                                                                                                                  
                items={filesWithIds.map((f) => f.id)}                                                                                                           
                strategy={verticalListSortingStrategy}                                                                                                          
              >                                                                                                                                                 
                <div className="space-y-3">                                                                                                                     
                  {filesWithIds.map((item, index) => (                                                                                                          
                    <div key={item.id} className="relative">                                                                                                    
                      <SortablePdfItem                                                                                                                          
                        id={item.id}                                                                                                                            
                        file={item.file}                                                                                                                        
                        index={index}                                                                                                                           
                        uploadedTime={getRelativeTime(item.uploadedAt)}                                                                                         
                        onRemove={() => removeFile(item.id)}                                                                                                    
                      />                                                                                                                                        
                    </div>                                                                                                                                      
                  ))}                                                                                                                                           
                </div>                                                                                                                                          
              </SortableContext>                                                                                                                                
            </DndContext>                                                                                                                                       
                                                                                                                                                                
            <div className="pt-6 flex justify-center">                                                                                                          
              <button                                                                                                                                           
                onClick={runScan}                                                                                                                               
                disabled={!filesWithIds.length || loading || scanState === 'scanning'}                                                                          
                className="mr-3 flex items-center gap-3 px-8 py-4 border border-foreground text-foreground font-semibold rounded-2xl disabled:opacity-60"       
              >                                                                                                                                                 
                {scanState === 'scanning' ? 'Scanning...' : 'Scan Files'}                                                                                       
              </button>                                                                                                                                         
              <button                                                                                                                                           
                onClick={handleMerge}                                                                                                                           
                disabled={loading || filesWithIds.length < 2 || scanState !== 'clean'}                                                                          
                className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-2xl disabled:opacity-60"                  
              >                                                                                                                                                 
                {loading ? (                                                                                                                                    
                  <>                                                                                                                                            
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Merging                                                                                                                                     
                  </>                                                                                                                                           
                ) : (                                                                                                                                           
                  <>                                                                                                                                            
                    <Combine className="w-5 h-5" />                                                                                                             
                    Merge PDFs                                                                                                                                  
                  </>                                                                                                                                           
                )}                                                                                                                                              
              </button>                                                                                                                                         
            </div>                                                                                                                                              
                                                                                                                                                                
            {mergedPdfUrl && !loading && (                                                                                                                      
              <div className="pt-3 flex justify-center gap-3">                                                                                                  
                <button                                                                                                                                         
                  onClick={handleDownloadMerged}                                                                                                                
                  className="flex items-center gap-2 px-5 py-3 border border-border rounded-xl text-muted-foreground hover:bg-muted"                            
                >                                                                                                                                               
                  <Download className="w-4 h-4" />                                                                                                              
                  Download                                                                                                                                      
                </button>                                                                                                                                       
                <button                                                                                                                                         
                  onClick={handlePrintMerged}                                                                                                                   
                  className="flex items-center gap-2 px-5 py-3 bg-accent/15 text-accent rounded-xl hover:bg-accent/25"                                          
                >                                                                                                                                               
                  <Printer className="w-4 h-4" />                                                                                                               
                  Print                                                                                                                                         
                </button>                                                                                                                                       
              </div>                                                                                                                                            
            )}                                                                                                                                                  
          </div>                                                                                                                                                
        )}                                                                                                                                                      
      </div>                                                                                                                                                    
    );                                                                                                                                                          
  }