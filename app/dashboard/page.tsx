import { FileText, ArrowLeftRight, ScanText, LayoutGrid } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-6 py-12 md:px-12">

        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-[#1e1e2e] tracking-tight mb-2">Choose a tool</h1>
          <p className="text-muted-foreground text-lg">Select what you want to do with your file</p>
        </div>

        {/* Tools Grid matching Image 2 Style */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-5xl">
         

          <ToolCard
            icon={FileText}
            title="PDF Tools"
            description="Work with PDF files"
            href="/tool/pdf-tools"
            disabled={false}
          />
          <ToolCard
            icon={ArrowLeftRight}
            title="File Conversion"
            description="Convert document formats"
            href="/tool/file-conversion"
            disabled={false}
          />
          <ToolCard
            icon={ScanText}
            title="OCR"
            description="Extract text from images"
            href="/tool/ocr"
            disabled={false}
          />
          <ToolCard
            icon={LayoutGrid}
            title="Data Tools"
            description="Clean and process files"
            href="/tool/data-tools"
            disabled={false}
          />
        </div>

      </main>
      {/* Footer is now in layout.tsx */}
    </div>
  );
}
