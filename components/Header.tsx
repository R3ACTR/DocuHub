"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, WifiOff, ServerOff, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const pathname = usePathname();

  const isHomeOrDashboard =
    pathname === "/" || pathname === "/dashboard";

  const [darkMode, setDarkMode] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    window.location.href = `/search?query=${encodeURIComponent(query)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background shadow-sm border-b border-border">
      {/* Top Header */}
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between pt-6 pb-4">
        
        {/* Logo */}
        {isHomeOrDashboard && (
          <div className="flex flex-col">
            <Link href="/" className="group">
              <span className="text-4xl font-bold text-foreground tracking-tight group-hover:opacity-80 transition-opacity">
                DocuHub
              </span>
            </Link>

            <span className="text-sm text-muted-foreground font-medium tracking-wide">
              Privacy-first, offline document processing
            </span>
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-3">

          {/* Search Bar */}
          {!isHomeOrDashboard && (
            <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card">
              <input
                type="text"
                placeholder="Search documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="px-3 py-1.5 bg-transparent outline-none text-sm"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-1.5 border-l border-border hover:bg-muted text-sm"
              >
                Search
              </button>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-card border border-border shadow hover:scale-105 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-primary" />
            ) : (
              <Moon className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

        </div>
      </div>

      {/* Banner Strip */}
      <div className="w-full bg-muted py-2.5 border-b border-border">
        <div className="container mx-auto px-6 md:px-12 flex flex-wrap items-center justify-center gap-6 md:gap-8 text-muted-foreground font-medium text-sm md:text-base">
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4" /> 100% Client-Side
          </span>

          <span className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" /> Works Offline
          </span>

          <span className="flex items-center gap-2">
            <ServerOff className="w-4 h-4" /> No Server Upload
          </span>
        </div>
      </div>
    </header>
  );
}
