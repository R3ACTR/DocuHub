import type { Metadata } from "next";
import localFont from "next/font/local"
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Navbar from "@/components/Navbar"; // ✅ ADD THIS

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <Navbar /> {/* ✅ ADD THIS */}
        {children}
        <Footer />
      </body>
    </html>
  );
}
