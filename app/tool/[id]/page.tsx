"use client";

import { ToolCard } from "@/components/ToolCard";
import { FileText } from "lucide-react";
import { Upload } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ToolUploadPage() {
    const router = useRouter();
    const params = useParams();
    const toolId = params.id;
    if (toolId === "pdf-tools") {
    return (
        <div className="min-h-screen flex flex-col">
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
                </div>

            </main>
        </div>
    );
}


    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Simulate upload delay then redirect to processing
            setTimeout(() => {
                router.push(`/tool/${toolId}/processing`);
            }, 500);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 container mx-auto px-6 py-12 md:px-12">

                <div className="mb-12">
                    <h1 className="text-3xl font-semibold text-[#1e1e2e] tracking-tight mb-2">Upload your file</h1>
                </div>

                <div className="w-full max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative w-full rounded-2xl border-2 border-dashed border-[#ccdcdb] bg-[#eef6f5] hover:bg-[#e4eff0] transition-colors"
                    >
                        <label className="flex flex-col items-center justify-center w-full h-[400px] cursor-pointer">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <div className="mb-6 text-[#1e1e2e]">
                                    <Upload className="w-16 h-16 stroke-1" />
                                </div>
                                <p className="mb-2 text-xl text-[#1e1e2e] font-medium">Drag & drop your file here</p>
                                <p className="text-base text-muted-foreground">or click to browse</p>
                            </div>
                            <input type="file" className="hidden" onChange={handleFile} />
                        </label>
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
