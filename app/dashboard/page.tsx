"use client";

import { FileText, ArrowLeftRight, ScanText, LayoutGrid, Search } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import ToolCardSkeleton from "@/components/ToolCardSkeleton";
import RecentFiles from "@/components/RecentFiles";
import RecentlyDeletedFiles from "@/components/RecentlyDeletedFiles";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRecentFiles } from "@/lib/hooks/useRecentFiles";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastTool, setLastTool] = useState<string | null>(null);
  const [hideResume, setHideResume] = useState(false);
  const [recentTools, setRecentTools] = useState<string[]>([]);
  const [toolCounts, setToolCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");

  const pathname = usePathname();

  const {
    recentFiles,
    deletedFiles,
    deleteRecentFile,
    restoreDeletedFile,
    permanentlyDeleteFile,
    clearRecentHistory,
    clearDeletedHistory,
  } = useRecentFiles();

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setIsLoading(false), 800);

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

  if (!mounted) return null;

  const mostUsedTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const tools = [
    {
      icon: FileText,
      title: "PDF Tools",
      description: "Work with PDF files",
      href: "/tool/pdf-tools",
    },
    {
      icon: ArrowLeftRight,
      title: "File Conversion",
      description: "Convert document formats",
      href: "/tool/file-conversion",
    },
    {
      icon: ScanText,
      title: "OCR",
      description: "Extract text from images",
      href: "/tool/ocr",
    },
    {
      icon: LayoutGrid,
      title: "Data Tools",
      description: "Clean and process files",
      href: "/tool/data-tools",
    },
  ];

  const filteredTools = tools.filter((tool) =>
    tool.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-6 py-12 md:px-12">

        {/* Resume Banner */}
        {lastTool && !hideResume && (
          <div className="mb-8 max-w-5xl rounded-xl border p-4 flex items-start justify-between gap-4 bg-card border-border shadow-sm">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Resume your last tool
              </p>

              <Link
                href={`/tool/${lastTool}`}
                className="text-base font-semibold text-foreground hover:underline"
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
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        )}

        {/* Most Used Tools */}
        {mostUsedTools.length > 0 && (
          <div className="mb-10 max-w-5xl p-5 rounded-xl bg-card border border-border shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Most Used Tools
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {mostUsedTools.map(([tool, count]) => (
                <Link
                  key={tool}
                  href={`/tool/${tool}`}
                  className="rounded-lg border p-4 transition flex justify-between items-center bg-card border-border hover:bg-muted"
                >
                  <span className="font-medium text-foreground">
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

        {/* Page Title + Search */}
        <div className="mb-12 p-5 rounded-xl bg-card border border-border shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight mb-2 text-foreground">
            Choose a tool
          </h1>

          <p className="text-muted-foreground text-lg mb-4">
            Select what you want to do with your file
          </p>

          {/* Search Bar */}
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background border-border max-w-md">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-5xl">
          {isLoading ? (
            <>
              <ToolCardSkeleton />
              <ToolCardSkeleton />
              <ToolCardSkeleton />
              <ToolCardSkeleton />
            </>
          ) : filteredTools.length > 0 ? (
            filteredTools.map((tool) => (
              <ToolCard
                key={tool.title}
                icon={tool.icon}
                title={tool.title}
                description={tool.description}
                href={tool.href}
                disabled={false}
                active={pathname === tool.href}
              />
            ))
          ) : (
            <p className="text-muted-foreground">No tools found.</p>
          )}
        </div>

        <RecentFiles
          files={recentFiles}
          onDelete={deleteRecentFile}
          onClear={clearRecentHistory}
        />
        <RecentlyDeletedFiles
          deletedFiles={deletedFiles}
          onRestore={restoreDeletedFile}
          onPermanentDelete={permanentlyDeleteFile}
          onClear={clearDeletedHistory}
        />
      </main>
    </div>
  );
}
