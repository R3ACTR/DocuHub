"use client";

import {
  FileText,
  ArrowLeftRight,
  ScanText,
  LayoutGrid,
  Search,
} from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import ToolCardSkeleton from "@/components/ToolCardSkeleton";
import RecentFiles from "@/components/RecentFiles";
import RecentlyDeletedFiles from "@/components/RecentlyDeletedFiles";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRecentFiles } from "@/lib/hooks/useRecentFiles";
import { PDF_TOOLS } from "@/lib/pdfTools";

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

const CATEGORY_CARDS = [
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
] as const;

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

    const storedCounts = JSON.parse(localStorage.getItem("toolUsageCounts") || "{}");
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

  const hasSearch = normalizedSearch.length > 0;
  const hasResults = filteredResults.length > 0;
  const categoryOrder: SearchCategory[] = ["pdf", "conversion", "ocr", "data"];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-6 py-12 md:px-12">
        {lastTool && !hideResume && (
          <div className="mb-8 max-w-5xl rounded-xl border p-4 flex items-start justify-between gap-4 bg-card border-border shadow-sm">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Resume your last tool</p>

              <Link
                href={`/tool/${lastTool}`}
                className="text-base font-semibold text-foreground hover:underline"
              >
                {`-> ${lastTool.replace("-", " ").toUpperCase()}`}
              </Link>
            </div>

            <button
              onClick={() => {
                if (lastTool) localStorage.setItem("hideResumeFor", lastTool);
                setHideResume(true);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              x
            </button>
          </div>
        )}

        {mostUsedTools.length > 0 && (
          <div className="mb-10 max-w-5xl p-5 rounded-xl bg-card border border-border shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4">Most Used Tools</h2>

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

                  <span className="text-sm text-muted-foreground">{count} uses</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mb-12 p-5 rounded-xl bg-card border border-border shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight mb-2 text-foreground">Choose a tool</h1>

          <p className="text-muted-foreground text-lg mb-4">
            Select what you want to do with your file
          </p>

          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background border-border max-w-md">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="bg-transparent outline-none text-sm w-full"
              aria-label="Search tools"
            />
          </div>
        </div>

        {hasSearch ? (
          hasResults ? (
            <div className="max-w-5xl space-y-6">
              {categoryOrder.map((category) => {
                const categoryResults = groupedResults[category];
                if (!categoryResults.length) return null;

                return (
                  <section
                    key={category}
                    className="rounded-xl border bg-card border-border shadow-sm"
                  >
                    <header className="px-4 py-3 border-b border-border">
                      <h2 className="text-sm font-semibold text-foreground">
                        {CATEGORY_LABELS[category]}
                      </h2>
                    </header>
                    <div className="divide-y divide-border">
                      {categoryResults.map((tool) => {
                        const absoluteIndex = filteredResults.findIndex(
                          (result) => result.id === tool.id
                        );
                        const isSelected = absoluteIndex === selectedResultIndex;

                        return (
                          <Link
                            key={tool.id}
                            href={tool.href}
                            className={`block px-4 py-3 transition ${
                              isSelected
                                ? "bg-primary/10 border-l-2 border-primary"
                                : "hover:bg-muted/50 border-l-2 border-transparent"
                            }`}
                          >
                            <p className="text-sm font-medium text-foreground">{tool.title}</p>
                            <p className="text-sm text-muted-foreground">{tool.description}</p>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="max-w-5xl rounded-xl border bg-card border-border shadow-sm p-6">
              <p className="text-base font-medium text-foreground mb-2">
                No tools found for "{search}".
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Try a different keyword or use one of these suggestions:
              </p>
              <div className="flex flex-wrap gap-2">
                {SEARCH_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setSearch(suggestion)}
                    className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-5xl">
            {isLoading ? (
              <>
                <ToolCardSkeleton />
                <ToolCardSkeleton />
                <ToolCardSkeleton />
                <ToolCardSkeleton />
              </>
            ) : (
              CATEGORY_CARDS.map((tool) => (
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

        <RecentFiles files={recentFiles} onDelete={deleteRecentFile} onClear={clearRecentHistory} />
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
