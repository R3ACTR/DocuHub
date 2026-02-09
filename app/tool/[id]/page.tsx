"use client";

import { ArrowLeft, FileText, Upload } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function ToolUploadPage() {
    const router = useRouter();
    const params = useParams();
    const toolId = params.id as string;

    const [hasUnsavedWork, setHasUnsavedWork] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Warn on refresh / tab close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!hasUnsavedWork) return;
            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [hasUnsavedWork]);

    const getToolTitle = () => {
        switch (toolId) {
            case "file-conversion":
                return "Upload document to convert";
            case "ocr":
                return "Upload image for text extraction";
            case "data-tools":
                return "Upload data file to process";
            default:
                return "Upload your file";
        }
    };

    const getSupportedTypes = () => {
        switch (toolId) {
            case "document-to-pdf":
                return [".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"];
            case "ocr":
                return [".jpg", ".jpeg", ".png"];
            case "pdf-tools":
            case "pdf-merge":
            case "pdf-split":
            case "pdf-protect":
            case "pdf-redact":
                return [".pdf"];
            default:
                return [];
        }
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = getSupportedTypes();
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

        if (allowedTypes.length && !allowedTypes.includes(fileExtension)) {
            setFileError(
                `Unsupported file type. Please upload ${allowedTypes.join(", ")} file(s).`
            );
            e.target.value = "";
            return;
        }

        setFileError(null);
        setSelectedFile(file);
        setHasUnsavedWork(true);
    };

    const handleBackNavigation = () => {
        if (hasUnsavedWork) {
            const confirmLeave = window.confirm(
                "You have unsaved work. Are you sure you want to leave this page?"
            );
            if (!confirmLeave) return;
        }
        router.push("/dashboard");
    };

    // PDF Tools page
    if (toolId === "pdf-tools") {
        return (
            <div className="min-h-screen flex flex-col">
                <div className="container mx-auto px-6 pt-6 md:px-12">
                    <button
                        onClick={handleBackNavigation}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1e1e2e]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                </div>

                <main className="flex-1 container mx-auto px-6 py-12 md:px-12">
                    <div className="mb-12">
                        <h1 className="text-3xl font-semibold text-[#1e1e2e] tracking-tight mb-2">
                            PDF Tools
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Choose a PDF tool
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
                        <ToolCard icon={FileText} title="Merge PDF" description="Combine multiple PDFs into one" href="/dashboard/pdf-merge" />
                        <ToolCard icon={FileText} title="Split PDF" description="Split PDF into separate pages" href="/dashboard/pdf-split" />
                        <ToolCard icon={FileText} title="Document to PDF" description="Convert documents into PDF format" href="/dashboard/document-to-pdf" />
                        <ToolCard icon={FileText} title="Protect PDF" description="Secure your PDF with a password" href="/dashboard/pdf-protect" />
                        <ToolCard icon={FileText} title="Redact PDF" description="Remove sensitive information from your PDF" href="/dashboard/pdf-redact" />
                    </div>
                </main>
            </div>
        );
    }

    // Upload page
    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 container mx-auto px-6 py-12 md:px-12">
                <button
                    onClick={handleBackNavigation}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1e1e2e] mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>

                <h1 className="text-3xl font-semibold text-[#1e1e2e] mb-12">
                    {getToolTitle()}
                </h1>

                <div className="w-full max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative w-full rounded-2xl border-2 border-dashed border-[#ccdcdb] bg-[#eef6f5]"
                    >
                        <label className="flex flex-col items-center justify-center h-[400px] cursor-pointer">
                            <Upload className="w-16 h-16 mb-4" />
                            <p className="text-xl font-medium">
                                Drag & drop your file here
                            </p>
                            <p className="text-muted-foreground">
                                or click to browse
                            </p>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFile}
                            />
                        </label>
                    </motion.div>

                    {fileError && (
                        <p className="mt-3 text-sm text-red-600">
                            {fileError}
                        </p>
                    )}

                    {selectedFile && (
                        <div className="mt-4 flex items-center justify-between rounded-lg border bg-white px-4 py-3 text-sm">
                            <div>
                                <p className="font-medium text-[#1e1e2e]">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setSelectedFile(null);
                                    setHasUnsavedWork(false);
                                }}
                                className="text-xs text-red-500 hover:underline"
                            >
                                Remove
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between text-xs text-muted-foreground mt-4 px-1">
                        <span>
                            Supported formats:{" "}
                            {getSupportedTypes().length > 0
                                ? getSupportedTypes().join(", ")
                                : "See tool requirements"}
                        </span>
                        <span>Max file size: 10MB</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
