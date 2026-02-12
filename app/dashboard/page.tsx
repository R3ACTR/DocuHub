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

  // ✅ NEW — recent tools state (safe add)
  const [recentTools, setRecentTools] = useState<string[]>([]);

  // ✅ NEW — usage count state
  const [toolCounts, setToolCounts] = useState<Record<string, number>>({});

  const pathname = usePathname(); // ✅ ADDED

  useEffect(() => {
    const storedTool = localStorage.getItem("lastUsedTool");
    const dismissedFor = localStorage.getItem("hideResumeFor");

    // ✅ Load recent tools
    const storedRecent = JSON.parse(
      localStorage.getItem("recentTools") || "[]"
    );
    setRecentTools(storedRecent);

    // ✅ Load usage counts
    const storedCounts = JSON.parse(
      localStorage.getItem("toolUsageCounts") || "{}"
    );
    setToolCounts(storedCounts);

    if (storedTool) {
      setLastTool(storedTool);
      setHideResume(dismissedFor === storedTool);
    }
  }, []);

  // ✅ Sort most used tools
  const mostUsedTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

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
                if (lastTool) {
                  localStorage.setItem("hideResumeFor", lastTool);
                }
                setHideResume(true);
              }}
              className="text-sm text-muted-foreground hover:text-[#1e1e2e]"
              aria-label="Dismiss resume suggestion"
            >
              ✕
            </button>
          </div>
        )}

        {/* ✅ NEW — MOST USED TOOLS SECTION */}
        {mostUsedTools.length > 0 && (
          <div className="mb-10 max-w-5xl">
            <h2 className="text-xl font-semibold text-[#1e1e2e] mb-4">
              Most Used Tools
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {mostUsedTools.map(([tool, count]) => (
                <Link
                  key={tool}
                  href={`/tool/${tool}`}
                  className="rounded-lg border p-4 bg-white hover:bg-[#f6fbfa] transition flex justify-between items-center"
                >
                  <span className="font-medium">
                    {tool.replace("-", " ").toUpperCase()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {count} uses
                  </span>
                </Link>
              ))}
            </div>
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
            active={pathname === "/tool/pdf-tools"}
          />

          <ToolCard
            icon={ArrowLeftRight}
            title="File Conversion"
            description="Convert document formats"
            href="/tool/file-conversion"
            disabled={false}
            active={pathname === "/tool/file-conversion"}
          />

          <ToolCard
            icon={ScanText}
            title="OCR"
            description="Extract text from images"
            href="/tool/ocr"
            disabled={false}
            active={pathname === "/tool/ocr"}
          />

          <ToolCard
            icon={LayoutGrid}
            title="Data Tools"
            description="Clean and process files"
            href="/tool/data-tools"
            disabled={false}
            active={pathname === "/tool/data-tools"}
          />

        </div>

        <RecentFiles />

      </main>
    </div>
  );
}
