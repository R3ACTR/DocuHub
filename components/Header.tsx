"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Shield, WifiOff, ServerOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const isHome = pathname === "/";

  const handleSearch = () => {
    if (!query.trim()) return;
    window.location.href = `/search?query=${encodeURIComponent(query)}`;
  };

  const navLinks = [
    { name: "PDF Tools", href: "/dashboard" },
    { name: "OCR", href: "/tool/ocr" },
    { name: "Conversion", href: "/tool/file-conversion" },
    { name: "Data Tools", href: "/tool/data-tools" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground transition-all group-hover:text-primary">
              DocuHub
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center overflow-hidden rounded-full border border-border/50 bg-muted/30 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <input
              type="text"
              placeholder="Search tools..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent px-4 py-1.5 text-sm outline-none w-40 md:w-60"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-1.5 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Search
            </button>
          </div>

          <Link
            href="/settings"
            className="p-2 rounded-full border border-border/50 bg-background/50 hover:bg-muted transition-all hover:rotate-45"
            aria-label="Open settings"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {isHome && (
        <div className="w-full border-t border-border/20 bg-muted/10 py-2">
          <div className="container mx-auto flex flex-wrap items-center justify-center gap-6 px-6 text-[10px] md:text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" /> 100% Client-Side
            </span>
            <span className="flex items-center gap-1.5">
              <WifiOff className="h-3 w-3" /> Works Offline
            </span>
            <span className="flex items-center gap-1.5">
              <ServerOff className="h-3 w-3" /> No Server Upload
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
