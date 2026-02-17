import { useState } from "react";
import { Trash2, RotateCcw, FileText as FileIcon } from "lucide-react";
import { DeletedFile } from "@/lib/hooks/useRecentFiles";
import { ConfirmationModal } from "./ConfirmationModal";

interface RecentlyDeletedFilesProps {
  deletedFiles: DeletedFile[];
  onRestore: (index: number) => void;
  onPermanentDelete: (index: number) => void;
  onClear: () => void;
}

export default function RecentlyDeletedFiles({
  deletedFiles,
  onRestore,
  onPermanentDelete,
  onClear,
}: RecentlyDeletedFilesProps) {
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "clear";
    index?: number;
  } | null>(null);

  if (deletedFiles.length === 0) return null;

  const handleConfirm = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "delete" && confirmAction.index !== undefined) {
      onPermanentDelete(confirmAction.index);
    } else if (confirmAction.type === "clear") {
      onClear();
    }
    setConfirmAction(null);
  };

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-500" />
          Recently Deleted
        </h2>

        <button
          onClick={() => setConfirmAction({ type: "clear" })}
          className="text-sm px-4 py-2 rounded-lg bg-rose-50 text-rose-600 font-medium hover:bg-rose-100 transition-colors"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-3">
        {deletedFiles.map((file, index) => (
          <div
            key={index}
            className="group p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all flex justify-between items-center"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-500">
                <FileIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">{file.fileName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                    {file.tool.replace("-", " ")}
                  </span>
                  <span>Deleted: {file.deletedTime}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onRestore(index)}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Restore"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={() => setConfirmAction({ type: "delete", index })}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Permanently Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={
          confirmAction?.type === "delete"
            ? "Delete File Permanently?"
            : "Clear Deletion History?"
        }
        message={
          confirmAction?.type === "delete"
            ? "This action cannot be undone. The file will be permanently removed from your history."
            : "This will permanently remove all files from your deletion history. This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
