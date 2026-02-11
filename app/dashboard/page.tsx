"use client";
import { FileText, ArrowLeftRight, ScanText, LayoutGrid } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import RecentFiles from "@/components/RecentFiles";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // ✅ ADDED

export default function Dashboard() {
  const [lastTool, setLastTool] = useState<string | null>(null);
  const [hideResume, setHideResume] = useState(false);

  const pathname = usePathname(); // ✅ ADDED

  useEffect(() => {
    const storedTool = localStorage.getItem("lastUsedTool");
    const dismissedFor = localStorage.getItem("hideResumeFor");

    if (storedTool) {
      setLastTool(storedTool);
      setHideResume(dismissedFor === storedTool);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-6 py-12 md:px-12">

        {lastTool && !hideResume && (
          <div className="mb-8 max-w-5xl rounded-xl border bg-[#eef6f5] p-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Resume your last tool
              </p>
              <Link
                href={`/tool/${lastTool}`}
                className="text-base font-semibold text-[#1e1e2e] hover:underline"
              >
                → {lastTool.replace("-", " ").toUpperCase()}
              </Link>
            </div>

            <button
              onClick={() => {
                localStorage.setItem("hideResume", "true");
                setHideResume(true);
              }}
              className="text-sm text-muted-foreground hover:text-[#1e1e2e]"
              aria-label="Dismiss resume suggestion"
            >
              ✕
            </button>
          </div>
        )}

        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-[#1e1e2e] tracking-tight mb-2">
            Choose a tool
          </h1>
          <p className="text-muted-foreground text-lg">
            Select what you want to do with your file
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-5xl">

          <ToolCard
            icon={FileText}
            title="PDF Tools"
            description="Work with PDF files"
            href="/tool/pdf-tools"
            disabled={false}
            active={pathname === "/tool/pdf-tools"} // ✅ ADDED
          />

          <ToolCard
            icon={ArrowLeftRight}
            title="File Conversion"
            description="Convert document formats"
            href="/tool/file-conversion"
            disabled={false}
            active={pathname === "/tool/file-conversion"} // ✅ ADDED
          />

          <ToolCard
            icon={ScanText}
            title="OCR"
            description="Extract text from images"
            href="/tool/ocr"
            disabled={false}
            active={pathname === "/tool/ocr"} // ✅ ADDED
          />

          <ToolCard
            icon={LayoutGrid}
            title="Data Tools"
            description="Clean and process files"
            href="/tool/data-tools"
            disabled={false}
            active={pathname === "/tool/data-tools"} // ✅ ADDED
          />

        </div>

        <RecentFiles />

      </main>
    </div>
  );
}
