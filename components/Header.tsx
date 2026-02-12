"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, WifiOff, ServerOff, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const pathname = usePathname();

  const isHomeOrDashboard =
    pathname === "/" || pathname === "/dashboard";

  // ✅ Dark Mode State
  const [darkMode, setDarkMode] = useState(false);

  // ✅ Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  // ✅ Toggle Theme
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

  return (
    <header className="sticky top-0 z-50 w-full bg-[#eef6f5] dark:bg-[#0f172a] shadow-sm">
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between py-6">

        {/* Logo Area */}
        {isHomeOrDashboard && (
          <div className="flex flex-col">
            <Link href="/" className="group">
              <span className="text-4xl font-bold text-[#1e1e2e] dark:text-white tracking-tight group-hover:opacity-80 transition-opacity">
                DocuHub
              </span>
            </Link>
            <span className="text-sm text-muted-foreground dark:text-gray-400 font-medium tracking-wide">
              Privacy-first, offline document processing
            </span>
          </div>
        )}

        {/* ✅ Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="ml-4 p-2 rounded-lg bg-white dark:bg-gray-800 shadow hover:scale-105 transition"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
          )}
        </button>

      </div>

      {/* Banner Strip */}
      <div className="w-full bg-[#cadbd9] dark:bg-[#1e293b] py-3 border-b border-white/20">
        <div className="container mx-auto px-6 flex flex-wrap items-center justify-center gap-6 md:gap-8 text-[#2d3748] dark:text-gray-300 font-medium text-sm md:text-base">
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
