"use client"; // ✅ MUST BE FIRST LINE

import { FileText, ArrowLeftRight, ScanText, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { FeatureCard } from "@/components/FeatureCard";
import { toast } from "sonner";

const features = [
  {
    icon: FileText,
    title: "PDF Tools",
    description: "Merge, split, and compress PDFs"
  },
  {
    icon: ArrowLeftRight,
    title: "File Conversion",
    description: "Convert documents easily"
  },
  {
    icon: ScanText,
    title: "OCR",
    description: "Extract text from images"
  },
  {
    icon: LayoutGrid,
    title: "Data Tools",
    description: "Clean and process files"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1">

        {/* ✅ Toast Test Button */}
        <div className="p-4 flex justify-center">
          <button
            onClick={() => toast.success("Toast Working ✅")}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Test Toast
          </button>
        </div>

        {/* Banner moved to Global Header */}

        {/* Hero Content */}
        <div className="container mx-auto px-6 md:px-12 mt-12 flex flex-col items-center">

          {/* CTA Section */}
          <div className="mb-20 w-full flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-[#1e1e2e] text-white font-medium text-lg hover:bg-[#1e1e2e]/90 transition-transform hover:scale-105 shadow-lg"
            >
              Get Started
            </Link>
          </div>

          {/* Features Grid Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1e1e2e]">
              What you can do with DocuHub
            </h2>
          </div>

          {/* 2x2 Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mb-24">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
