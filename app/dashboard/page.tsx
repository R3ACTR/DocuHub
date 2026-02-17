"use client";

import {
  FileText,
  ArrowLeftRight,
  ScanText,
  LayoutGrid,
  Search,
  ArrowRight,
} from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import ToolCardSkeleton from "@/components/ToolCardSkeleton";
import RecentFiles from "@/components/RecentFiles";
import RecentlyDeletedFiles from "@/components/RecentlyDeletedFiles";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRecentFiles } from "@/lib/hooks/useRecentFiles";
import { motion } from "framer-motion";
import { PDF_TOOLS } from "@/lib/pdfTools";

// --- Upstream Types & Constants ---
type SearchCategory = "pdf" | "conversion" | "ocr" | "data";

type SearchableTool = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: SearchCategory;
  keywords: string[];
};

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  pdf: "PDF Tools",
  conversion: "File Conversion",
  ocr: "OCR",
  data: "Data Tools",
};

const SEARCH_SUGGESTIONS = ["merge", "split", "OCR"];

const KEYWORDS_BY_TOOL_ID: Record<string, string[]> = {
  "pdf-merge": ["merge", "combine", "join"],
  "pdf-split": ["split", "separate", "extract pages"],
  "pdf-watermark": ["watermark", "stamp", "branding"],
  "metadata-viewer": ["metadata", "properties", "document info"],
  "pdf-redact": ["redact", "blackout", "remove sensitive"],
  "pdf-compress": ["compress", "reduce size", "shrink"],
  "pdf-protect": ["protect", "password", "encrypt"],
  "pdf-page-numbers": ["page numbers", "pagination"],
  "pdf-extract-images": ["extract images", "images"],
  "pdf-delete-pages": ["delete pages", "remove pages"],
  "pdf-page-reorder": ["reorder pages", "arrange pages"],
  "pdf-password-remover": ["password remover", "unlock"],
  "document-to-pdf": ["convert", "docx", "txt", "word"],
  "jpeg-to-pdf": ["convert", "jpeg", "jpg", "image"],
  "png-to-pdf": ["convert", "png", "image"],
  "pdf-rotate": ["rotate", "orientation"],
  ocr: ["ocr", "scan", "extract text"],
};

const CONVERSION_TOOL_IDS = new Set(["document-to-pdf", "jpeg-to-pdf", "png-to-pdf"]);
const DATA_TOOL_IDS = new Set(["metadata-viewer", "pdf-redact"]);

function getToolCategory(id: string): SearchCategory {
  if (id === "ocr") return "ocr";
  if (CONVERSION_TOOL_IDS.has(id)) return "conversion";
  if (DATA_TOOL_IDS.has(id)) return "data";
  return "pdf";
}

function scoreTool(tool: SearchableTool, query: string): number {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return 0;

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const title = tool.title.toLowerCase();
  const description = tool.description.toLowerCase();
  const id = tool.id.toLowerCase();
  const keywords = tool.keywords.map((keyword) => keyword.toLowerCase());

  const haystack = [title, description, id, ...keywords].join(" ");
  const allTokensMatch = tokens.every((token) => haystack.includes(token));
  if (!allTokensMatch) return 0;

  let score = 1;
  if (title.includes(normalizedQuery)) score += 5;
  if (description.includes(normalizedQuery)) score += 3;
  if (keywords.some((keyword) => keyword.includes(normalizedQuery))) score += 4;
  if (id.includes(normalizedQuery)) score += 2;

  return score;
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastTool, setLastTool] = useState<string | null>(null);
  const [hideResume, setHideResume] = useState(false);
  const [toolCounts, setToolCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  const pathname = usePathname();
  const router = useRouter();

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

    const storedCounts = JSON.parse(
      localStorage.getItem("toolUsageCounts") || "{}"
    );
    setToolCounts(storedCounts);

    if (storedTool) {
      setLastTool(storedTool);
      setHideResume(dismissedFor === storedTool);
    }
  }, []);

  const searchableTools = useMemo<SearchableTool[]>(() => {
    const tools = PDF_TOOLS.map((tool) => ({
      id: tool.id,
      title: tool.title,
      description: tool.description,
      href: tool.href,
      category: getToolCategory(tool.id),
      keywords: KEYWORDS_BY_TOOL_ID[tool.id] ?? [],
    }));

    tools.push({
      id: "ocr",
      title: "OCR",
      description: "Extract text from images",
      href: "/tool/ocr",
      category: "ocr",
      keywords: KEYWORDS_BY_TOOL_ID.ocr ?? [],
    });

    // Add conversion tools manually if they aren't in PDF_TOOLS
    // Assuming PDF_TOOLS doesn't have conversion tools based on the conflict snippet
    // But let's check duplicate protection below.
    const extraTools = [
      { id: "document-to-pdf", title: "Document to PDF", desc: "Convert TXT and DOCX to PDF", href: "/dashboard/document-to-pdf", category: "conversion" },
      { id: "jpeg-to-pdf", title: "JPEG to PDF", desc: "Convert JPEG images to PDF", href: "/tool/jpeg-to-pdf", category: "conversion" },
      { id: "png-to-pdf", title: "PNG to PDF", desc: "Convert PNG images to PDF", href: "/tool/png-to-pdf", category: "conversion" },
      { id: "metadata-viewer", title: "Metadata Viewer", desc: "View PDF metadata", href: "/tool/metadata-viewer", category: "data" },
      { id: "pdf-redact", title: "Redact PDF", desc: "Permanently remove text", href: "/tool/pdf-redact", category: "data" }
    ];

    extraTools.forEach(t => {
      tools.push({
        id: t.id,
        title: t.title,
        description: t.desc,
        href: t.href,
        category: t.category as SearchCategory,
        keywords: KEYWORDS_BY_TOOL_ID[t.id] ?? []
      });
    });


    const deduped = new Map<string, SearchableTool>();
    tools.forEach((tool) => {
      if (!deduped.has(tool.id)) deduped.set(tool.id, tool);
    });

    return Array.from(deduped.values());
  }, []);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredResults = useMemo(() => {
    if (!normalizedSearch) return [];

    return searchableTools
      .map((tool) => ({ tool, score: scoreTool(tool, normalizedSearch) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.tool.title.localeCompare(b.tool.title))
      .map((entry) => entry.tool);
  }, [normalizedSearch, searchableTools]);

  const groupedResults = useMemo(() => {
    const groups: Record<SearchCategory, SearchableTool[]> = {
      pdf: [],
      conversion: [],
      ocr: [],
      data: [],
    };

    filteredResults.forEach((tool) => {
      groups[tool.category].push(tool);
    });

    return groups;
  }, [filteredResults]);

  useEffect(() => {
    setSelectedResultIndex(0);
  }, [normalizedSearch, filteredResults.length]);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!filteredResults.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedResultIndex((previous) =>
        previous >= filteredResults.length - 1 ? 0 : previous + 1
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedResultIndex((previous) =>
        previous <= 0 ? filteredResults.length - 1 : previous - 1
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selectedTool = filteredResults[selectedResultIndex] ?? filteredResults[0];
      if (selectedTool) router.push(selectedTool.href);
    }
  };

  if (!mounted) return null;

  const mostUsedTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Simplified tool list for the main grid (fallback/default view)
  const defaultTools = [
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

  const hasSearch = normalizedSearch.length > 0;
  const hasResults = filteredResults.length > 0;
  const categoryOrder: SearchCategory[] = ["pdf", "conversion", "ocr", "data"];

  return (
    <div className="min-h-screen flex flex-col bg-background/50">
      <main className="flex-1 container mx-auto px-6 py-12 md:px-12 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Resume Banner */}
          {lastTool && !hideResume && (
            <div className="mb-10 rounded-2xl border border-primary/20 p-6 flex items-center justify-between gap-4 bg-primary/5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary text-primary-foreground hidden sm:block">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary/80 uppercase tracking-wider">
                    Resume your work
                  </p>
                  <Link
                    href={`/tool/${lastTool}`}
                    className="text-lg font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    {lastTool.replace("-", " ").toUpperCase()}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <button
                onClick={() => {
                  if (lastTool) {
                    localStorage.setItem("hideResumeFor", lastTool);
                  }
                  setHideResume(true);
                }}
                className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                aria-label="Dismiss resume banner"
              >
                ✕
              </button>
            </div>
          )}

          {/* Page Title + Search */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h1 className="text-4xl font-black tracking-tight mb-2 text-foreground">
                  Workspace
                </h1>
                <p className="text-muted-foreground text-lg">
                  Select a tool to begin processing your documents.
                </p>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-3 border border-border/60 rounded-2xl px-4 py-3 bg-card shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all w-full md:w-80">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Find a tool..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="bg-transparent outline-none text-sm w-full font-medium"
                />
              </div>
            </div>

            {/* Most Used Tools - Show only if not searching */}
            {mostUsedTools.length > 0 && !hasSearch && (
              <div className="mb-12">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  Frequently Used
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {mostUsedTools.map(([tool, count]) => (
                    <Link
                      key={tool}
                      href={`/tool/${tool}`}
                      className="glass-card p-5 flex flex-col justify-between group"
                    >
                      <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {tool.replace("-", " ").toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground mt-2">
                        {count} sessions
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Content Area: Search Results OR Default Grid */}
        {hasSearch ? (
          hasResults ? (
            <div className="max-w-5xl space-y-6">
              {categoryOrder.map((category) => {
                const categoryResults = groupedResults[category];
                if (!categoryResults.length) return null;

                return (
                  <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={category}
                    className="glass-card overflow-hidden"
                  >
                    <header className="px-6 py-4 border-b border-border/50 bg-muted/20">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        {CATEGORY_LABELS[category]}
                      </h2>
                    </header>
                    <div className="divide-y divide-border/50">
                      {categoryResults.map((tool) => {
                        const absoluteIndex = filteredResults.findIndex(
                          (result) => result.id === tool.id
                        );
                        const isSelected = absoluteIndex === selectedResultIndex;

                        return (
                          <Link
                            key={tool.id}
                            href={tool.href}
                            className={`block px-6 py-4 transition-colors ${isSelected
                              ? "bg-primary/5 pl-5 border-l-4 border-primary"
                              : "hover:bg-muted/30 border-l-4 border-transparent"
                              }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-bold text-foreground">{tool.title}</p>
                                <p className="text-xs text-muted-foreground">{tool.description}</p>
                              </div>
                              {isSelected && <ArrowRight className="w-4 h-4 text-primary" />}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.section>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-5xl glass-card p-12 text-center"
            >
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                No tools found for "{search}".
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Try a different keyword or use one of these suggestions:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SEARCH_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setSearch(suggestion)}
                    className="rounded-full border border-border/60 px-4 py-2 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )
        ) : (
          /* Default Tools Grid (When not searching) */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-5xl">
            {isLoading ? (
              <>
                <ToolCardSkeleton />
                <ToolCardSkeleton />
                <ToolCardSkeleton />
                <ToolCardSkeleton />
              </>
            ) : (
              defaultTools.map((tool) => (
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
            )}
          </div>
        )}

        <div className="mt-12">
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
        </div>
      </main>
    </div>
  );
}
