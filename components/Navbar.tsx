"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-foreground">
          DocuHub
        </Link>

        <div className="flex gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/dashboard" className="transition hover:text-foreground">
            PDF Tools
          </Link>
          <Link href="/tool/ocr" className="transition hover:text-foreground">
            OCR
          </Link>
          <Link href="/tool/file-conversion" className="transition hover:text-foreground">
            File Conversion
          </Link>
          <Link href="/tool/data-tools" className="transition hover:text-foreground">
            Data Tools
          </Link>
          <Link href="/settings" className="transition hover:text-foreground">
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
}
