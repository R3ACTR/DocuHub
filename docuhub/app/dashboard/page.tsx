"use client";

import { Header } from "@/components/Header";
// Inline UI Components for speed
import { FileText, Image as ImageIcon, Settings, Upload } from "lucide-react";
import Link from "next/link";
import { useState, useCallback } from "react";

// Inline UI Components for speed
function ToolCard({ icon: Icon, title, description, href, disabled }: any) {
  return (
    <Link 
      href={disabled ? "#" : href} 
      className={`group block h-full space-y-4 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [fileInfo, setFileInfo] = useState<any>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileInfo({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: file.type,
        lastModified: new Date(file.lastModified).toLocaleString()
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Access your document tools.</p>
        </div>

        {/* Quick File Inspector (Functional Demo) */}
        <div className="mb-12 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <h2 className="mb-4 text-xl font-semibold">Local File Inspector (Demo)</h2>
          <p className="mb-6 text-sm text-muted-foreground">Select a file to view its metadata instantly without uploading.</p>
          
          <div className="flex flex-col items-center justify-center gap-4">
            <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <input type="file" className="hidden" onChange={handleFile} />
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" /> Select File
              </div>
            </label>
            
            {fileInfo ? (
  <div className="mt-4 w-full max-w-md rounded-lg border border-border bg-card p-4 text-left shadow-sm">
    <div className="grid grid-cols-2 gap-2 text-sm">
      <span className="font-semibold">Name:</span> <span>{fileInfo.name}</span>
      <span className="font-semibold">Size:</span> <span>{fileInfo.size}</span>
      <span className="font-semibold">Type:</span> <span>{fileInfo.type || "Unknown"}</span>
      <span className="font-semibold">Modified:</span> <span>{fileInfo.lastModified}</span>
    </div>
  </div>
) : (
  <p className="mt-4 text-sm text-muted-foreground">
    No file selected yet. Upload a file to view its details.
  </p>
)}

          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard
            icon={FileText}
            title="PDF Merge"
            description="Combine multiple PDF files into a single document."
            href="/dashboard/pdf-merge"
            disabled={true} 
          />
           <ToolCard
            icon={FileText}
            title="PDF Split"
            description="Separate a PDF into individual pages."
            href="/dashboard/pdf-split"
            disabled={true}
          />
          <ToolCard
            icon={ImageIcon}
            title="Image to PDF"
            description="Convert PNG, JPG, or WebP images to PDF format."
            href="/dashboard/image-to-pdf"
            disabled={true} // Placeholder
          />
           <ToolCard
            icon={ImageIcon}
            title="Image Resizer"
            description="Resize and compress images locally."
            href="/dashboard/image-resize"
            disabled={true}
          />
          <ToolCard
            icon={Settings}
            title="Settings"
            description="Configure default output settings and clear cache."
            href="/settings"
            disabled={true}
          />
        </div>
        
        <div className="mt-12 rounded-lg bg-blue-500/10 p-4 text-center text-sm text-blue-600 dark:text-blue-400">
          <p>More tools coming soon. All processing happens on your device.</p>
        </div>
      </main>
    </div>
  );
}
