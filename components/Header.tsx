"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Shield, WifiOff, ServerOff } from "lucide-react";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const isHomeOrDashboard = pathname === "/" || pathname === "/dashboard";
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (!query.trim()) return;
    window.location.href = `/search?query=${encodeURIComponent(query)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-6 pb-4 pt-6 md:px-12">
        {isHomeOrDashboard && (
          <div className="flex flex-col">
            <Link href="/" className="group">
              <span className="text-4xl font-bold tracking-tight text-foreground transition-opacity group-hover:opacity-80">
                DocuHub
              </span>
            </Link>
            <span className="text-sm font-medium tracking-wide text-muted-foreground">
              Privacy-first, offline document processing
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {!isHomeOrDashboard && (
            <div className="flex items-center overflow-hidden rounded-lg border border-border bg-card">
              <input
                type="text"
                placeholder="Search documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent px-3 py-1.5 text-sm outline-none"
              />
              <button
                onClick={handleSearch}
                className="border-l border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Search
              </button>
            </div>
          )}

          <Link
            href="/settings"
            className="rounded-lg border border-border bg-card p-2 shadow transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Open settings"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <div className="w-full border-b border-border bg-muted py-2.5">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-6 px-6 text-sm font-medium text-muted-foreground md:gap-8 md:px-12 md:text-base">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> 100% Client-Side
          </span>
          <span className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" /> Works Offline
          </span>
          <span className="flex items-center gap-2">
            <ServerOff className="h-4 w-4" /> No Server Upload
          </span>
        </div>
      </div>
    </header>
  );
}
