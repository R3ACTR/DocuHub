"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full border-b bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="text-xl font-semibold text-[#1e1e2e]">
          DocuHub
        </Link>

        {/* Nav Links */}
        <div className="flex gap-6 text-sm font-medium text-muted-foreground">

          <Link href="/dashboard" className="hover:text-black transition">
            PDF Tools
          </Link>

          <Link href="/tool/ocr" className="hover:text-black transition">
            OCR
          </Link>

          <Link href="/tool/file-conversion" className="hover:text-black transition">
            File Conversion
          </Link>

          <Link href="/tool/data-tools" className="hover:text-black transition">
            Data Tools
          </Link>

        </div>
      </div>
    </nav>
  );
}
