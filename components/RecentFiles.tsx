"use client";

import { Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import { RecentFile } from "@/lib/hooks/useRecentFiles";

interface RecentFilesProps {
  files: RecentFile[];
  onDelete: (index: number) => void;
  onClear: () => void;
}

export default function RecentFiles({ files, onDelete, onClear }: RecentFilesProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fallbackToolLinks: Record<string, string> = {
    "document to pdf": "/dashboard/document-to-pdf",
    "pdf merge": "/dashboard/pdf-merge",
    "pdf split": "/dashboard/pdf-split",
    "pdf compress": "/dashboard/pdf-compress",
    "pdf watermark": "/dashboard/pdf-watermark",
    "pdf protect": "/dashboard/pdf-protect",
    "pdf redact": "/dashboard/pdf-redact",
    "metadata viewer": "/dashboard/metadata-viewer",
  };

  const resolveLink = (file: RecentFile) => {
    if (file.link) return file.link;
    const mapped = fallbackToolLinks[file.tool.toLowerCase()];
    return mapped || "/dashboard";
  };

  const handleCopyLink = async (file: RecentFile, index: number) => {
    const link = resolveLink(file);
    const absoluteLink =
      link.startsWith("http://") || link.startsWith("https://")
        ? link
        : `${window.location.origin}${link}`;
    await navigator.clipboard.writeText(absoluteLink);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  if (files.length === 0) return null;

  return (
    <div className="mt-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Files</h2>

        <button
          onClick={() => setShowClearModal(true)}
          className="text-danger hover:opacity-80 text-sm font-medium"
        >
          Clear History
        </button>
      </div>

      {/* File List */}
      <div className="grid gap-4">
        {files.map((file, index) => (
          <div
            key={index}
            className="p-5 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-premium transition-all group"
          >
            <div>
              <p className="font-bold text-foreground group-hover:text-primary transition-colors">{file.fileName}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">{file.tool}</span>
                <span>•</span>
                <span>{file.time}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyLink(file, index)}
                className="px-3 py-1.5 text-xs border rounded-md hover:bg-muted transition"
                title="Copy Link"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Copy size={14} />
                  {copiedIndex === index ? "Copied!" : "Copy Link"}
                </span>
              </button>

              {/* Delete Button */}
              <button
                onClick={() => {
                  setSelectedIndex(index);
                  setShowDeleteModal(true);
                }}
                className="p-2 text-danger hover:bg-danger/10 rounded-full transition"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-foreground/40 z-50">
          <div className="bg-card rounded-lg shadow-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this file?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-md border text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (selectedIndex !== null) {
                    onDelete(selectedIndex);
                  }
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 rounded-md bg-danger text-primary-foreground hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Modal */}
      {showClearModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-foreground/40 z-50">
          <div className="bg-card rounded-lg shadow-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">Clear History</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to clear all recent files?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-md border text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  onClear();
                  setShowClearModal(false);
                }}
                className="px-4 py-2 rounded-md bg-danger text-primary-foreground hover:opacity-90"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

