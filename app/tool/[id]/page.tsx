"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ToolCard } from "@/components/ToolCard";
import { FileText, Upload } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    saveToolState,
    loadToolState,
    clearToolState,
} from "@/lib/toolStateStorage";


export default function ToolUploadPage() {
    const router = useRouter();
    const params = useParams();
    const toolId = params.id;
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    useEffect(() => {
        if (!toolId) return;

        const storedState = loadToolState(toolId as string);

        if (storedState?.selectedFiles) {
            setSelectedFiles(storedState.selectedFiles);
        }
    }, [toolId]);
    useEffect(() => {
        if (!toolId) return;

        saveToolState(toolId as string, {
            selectedFiles,
        });
    }, [toolId, selectedFiles]);



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


    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileMeta = {
            name: file.name,
            size: file.size,
            type: file.type,
        };

        setSelectedFiles([fileMeta]);
    };



    // PDF Tools page
    if (toolId === "pdf-tools") {
        return (
            <div className="min-h-screen flex flex-col">

                {/* Back to Dashboard */}
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
                        <h1 className="text-3xl font-semibold text-[#1e1e2e] tracking-tight mb-2">
                            PDF Tools
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Choose a PDF tool
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
                        <ToolCard
                            icon={FileText}
                            title="Merge PDF"
                            description="Combine multiple PDFs into one"
                            href="/dashboard/pdf-merge"
                            disabled={false}
                        />

                        <ToolCard
                            icon={FileText}
                            title="Split PDF"
                            description="Split PDF into separate pages"
                            href="/dashboard/pdf-split"
                            disabled={false}
                        />

                        <ToolCard
                            icon={FileText}
                            title="Document to PDF"
                            description="Convert documents into PDF format"
                            href="/dashboard/document-to-pdf"
                            disabled={false}
                        />

                        <ToolCard
                            icon={FileText}
                            title="Protect PDF"
                            description="Secure your PDF with a password"
                            href="/dashboard/pdf-protect"
                            disabled={false}
                        />
                    </div>
                </main>
            </div>
        );
    }


    // Upload page for other tools
    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 container mx-auto px-6 py-12 md:px-12">
                {/* Back to Dashboard */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1e1e2e] mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                <div className="mb-12">
                    <h1 className="text-3xl font-semibold text-[#1e1e2e] tracking-tight mb-2">
                        {getToolTitle()}
                    </h1>

                </div>

                <div className="w-full max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative w-full rounded-2xl border-2 border-dashed border-[#ccdcdb] bg-[#eef6f5] hover:bg-[#e4eff0] transition-colors"
                    >
                        {selectedFiles.length === 0 ? (
                            <label className="flex flex-col items-center justify-center w-full h-[400px] cursor-pointer">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="mb-6 text-[#1e1e2e]">
                                        <Upload className="w-16 h-16 stroke-1" />
                                    </div>
                                    <p className="mb-2 text-xl text-[#1e1e2e] font-medium">
                                        Drag & drop your file here
                                    </p>
                                    <p className="text-base text-muted-foreground">
                                        or click to browse
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFile}
                                />
                            </label>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[400px]">
                                <FileText className="w-16 h-16 mb-4 text-[#1e1e2e]" />
                                <p className="text-lg font-medium text-[#1e1e2e]">
                                    {selectedFiles[0].name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {(selectedFiles[0].size / 1024).toFixed(1)} KB
                                </p>
                                <button
                                    className="mt-4 text-sm text-red-500 hover:underline"
                                    onClick={() => {
                                        setSelectedFiles([]);
                                        clearToolState(toolId as string);
                                    }}
                                >
                                    Remove file
                                </button>
                            </div>
                        )}

                    </motion.div>

                    <div className="flex justify-between text-xs text-muted-foreground mt-4 px-1">
                        <span>Supported formats: PDF, JPG, PNG</span>
                        <span>Max file size: 10MB</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
