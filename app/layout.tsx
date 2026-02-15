import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner"; // ✅ ADDED (Sonner Import)

const geistSans = localFont({
  variable: "--font-geist-sans",
  src: "./fonts/Geist-Variable.woff2",
  display: "swap",
});

const geistMono = localFont({
  variable: "--font-geist-mono",
  src: "./fonts/GeistMono-Variable.woff2",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DocuHub",
  description: "Privacy-first document processing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <Navbar />
        {children}
        <Footer />

        {/* ✅ ADDED — Global Toast Provider */}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
