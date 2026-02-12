import {
  Combine,
  Minimize2,
  Scissors,
  FileText,
  FileUp,
} from "lucide-react";

export const PDF_TOOLS = Object.freeze([
  {
    id: "pdf-merge",
    title: "Merge PDF",
    description: "Combine PDFs",
    href: "/dashboard/pdf-merge",
    icon: Combine,
  },
  {
    id: "pdf-compress",
    title: "Compress PDF",
    description: "Reduce file size",
    href: "/tool/pdf-compress",
    icon: Minimize2,
  },
  {
    id: "pdf-split",
    title: "Split PDF",
    description: "Split pages",
    href: "/dashboard/pdf-split",
    icon: Scissors,
  },
  {
    id: "pdf-protect",
    title: "Protect PDF",
    description: "Add password protection",
    href: "/tool/pdf-protect",
    icon: FileText,
  },
  {
    id: "pdf-redact",
    title: "Redact PDF",
    description: "Remove sensitive information",
    href: "/tool/pdf-redact",
    icon: FileUp,
  },
  {
    id: "metadata-viewer",
    title: "Metadata Viewer",
    description: "View PDF metadata details",
    href: "/tool/metadata-viewer",
    icon: FileText,
  },
]);
