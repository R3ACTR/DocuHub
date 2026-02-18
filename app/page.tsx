"use client";

import { FileText, ArrowLeftRight, ScanText, LayoutGrid, Shield, WifiOff, ServerOff, ArrowRight } from "lucide-react";
import Link from "next/link";
import { FeatureCard } from "@/components/FeatureCard";
import { motion } from "framer-motion";

const features = [
  {
    icon: FileText,
    title: "PDF Powerhouse",
    description: "Merge, split, and compress your PDF documents with military-grade precision and speed."
  },
  {
    icon: ArrowLeftRight,
    title: "Format Fluidity",
    description: "Seamlessly convert between document types without losing a single pixel of formatting."
  },
  {
    icon: ScanText,
    title: "AI OCR Insight",
    description: "Intelligent text extraction that breathes life into static images and scanned documents."
  },
  {
    icon: LayoutGrid,
    title: "Advanced Processing",
    description: "A suite of professional tools to clean, redact, and structure your data exactly how you need it."
  }
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col mesh-gradient overflow-hidden">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="container mx-auto px-6 md:px-12 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl"
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground mb-8 leading-[0.9]">
                Professional <br />
                <span className="text-gradient">Document Control.</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                Privacy-first, industry-standard document processing that runs entirely on your device. No uploads, no risks.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/dashboard"
                className="premium-button h-16 px-10 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 shadow-2xl group"
              >
                Launch Dashboard
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center h-16 px-10 rounded-2xl border border-border/60 bg-background/50 backdrop-blur font-bold text-lg hover:bg-muted transition-all"
              >
                Explore Tools
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 border-y border-border/20 bg-card/20 backdrop-blur-sm">
          <div className="container mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              {[
                { icon: Shield, title: "100% Secure", text: "Your files never leave your machine. Processing happens locally in your browser sandbox." },
                { icon: WifiOff, title: "Offline Ready", text: "Work from anywhere. DocuHub doesn't require an internet connection once loaded." },
                { icon: ServerOff, title: "No Accounts", text: "Start processing instantly. We don't store your data, and we don't track your identity." }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="container mx-auto px-6 md:px-12 py-32">
          <div className="mb-20 text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold tracking-tight text-foreground mb-4">
              Designed for Professionals
            </h2>
            <p className="text-muted-foreground text-lg">
              DocuHub provides a high-performance suite of local-first tools for your critical document workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

