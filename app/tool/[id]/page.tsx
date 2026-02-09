"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import { ToolCard } from "@/components/ToolCard";
import { useParams } from "next/navigation";
import { useState, useRef } from "react";
import { motion } from "framer-motion";

export default function ToolUploadPage() {
    const params = useParams();
    const toolId = params.id as string;

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
    };

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

    // PDF Tools page
    if (toolId === "pdf-tools") {
        return (
            <div className="min-h-screen flex flex-col">
                <div className="container mx-auto px-6 pt-6 md:px-12">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1e1e2e]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                <main className="flex-1 container mx-auto px-6 py-12 md:px-12">
                    <div className="mb-12">
                        <h1 className="text-3xl font-semibold text-[#1e1e2e] mb-2">
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
                    </div>
                </main>
            </div>
        );
    }

    // Upload page
    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 container mx-auto px-6 py-12 md:px-12">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1e1e2e] mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

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

                    {selectedFile && (
                        <div className="mt-4 text-sm text-muted-foreground">
                            <p>
                                <strong>Selected file:</strong>{" "}
                                {selectedFile.name} (
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </p>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-2 text-sm text-blue-600 hover:underline"
                            >
                                Change file
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
