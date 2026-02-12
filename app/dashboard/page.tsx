"use client";
import { FileText, ArrowLeftRight, ScanText, LayoutGrid } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import RecentFiles from "@/components/RecentFiles";
import RecentlyDeletedFiles from "@/components/RecentlyDeletedFiles"; // ✅ ADDED
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Dashboard() {
  const [lastTool, setLastTool] = useState<string | null>(null);
  const [hideResume, setHideResume] = useState(false);

  const [recentTools, setRecentTools] = useState<string[]>([]);
  const [toolCounts, setToolCounts] = useState<Record<string, number>>({});

  const pathname = usePathname();

  useEffect(() => {
    const storedTool = localStorage.getItem("lastUsedTool");
    const dismissedFor = localStorage.getItem("hideResumeFor");

    const storedRecent = JSON.parse(
      localStorage.getItem("recentTools") || "[]"
    );
    setRecentTools(storedRecent);

    const storedCounts = JSON.parse(
      localStorage.getItem("toolUsageCounts") || "{}"
    );
    setToolCounts(storedCounts);

    if (storedTool) {
      setLastTool(storedTool);
      setHideResume(dismissedFor === storedTool);
    }
  }, []);

  const mostUsedTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-6 py-12 md:px-12">

        {/* Resume Banner */}
        {lastTool && !hideResume && (
          <div className="
            mb-8 max-w-5xl rounded-xl border p-4 flex items-start justify-between gap-4
            bg-white dark:bg-slate-800
            border-gray-200 dark:border-slate-700
            shadow-sm
          ">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Resume your last tool
              </p>

              <Link
                href={`/tool/${lastTool}`}
                className="text-base font-semibold text-gray-900 dark:text-white hover:underline"
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
              className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* MOST USED TOOLS */}
        {mostUsedTools.length > 0 && (
          <div className="
            mb-10 max-w-5xl p-5 rounded-xl
            bg-white/80 dark:bg-slate-900/40
            border border-gray-200 dark:border-slate-700
            shadow-sm
          ">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Most Used Tools
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {mostUsedTools.map(([tool, count]) => (
                <Link
                  key={tool}
                  href={`/tool/${tool}`}
                  className="
                  rounded-lg border p-4 transition flex justify-between items-center
                  bg-white dark:bg-slate-800
                  border-gray-200 dark:border-slate-700
                  hover:bg-gray-50 dark:hover:bg-slate-700
                "
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {tool.replace("-", " ").toUpperCase()}
                  </span>

                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {count} uses
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Choose Tool Header */}
        <div className="
          mb-12 p-5 rounded-xl
          bg-white/80 dark:bg-slate-900/40
          border border-gray-200 dark:border-slate-700
          shadow-sm
        ">
          <h1 className="text-3xl font-semibold tracking-tight mb-2 text-gray-900 dark:text-white">
            Choose a tool
          </h1>

          <p className="text-gray-600 dark:text-gray-400 text-lg">
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

        {/* ✅ ADDED — Recently Deleted Section */}
        <RecentlyDeletedFiles />

      </main>
    </div>
  );
}
