"use client";

import { useEffect, useState } from "react";
import { X, Command, Search, ArrowRight, Home, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export function KeyboardShortcutsModal() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Toggle modal with '?' (Shift + /)
            if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }

            // Close with Escape
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }

            // Navigation shortcuts (only if modal is NOT open, to avoid conflicts)
            // but maybe we want them available always? Let's check typical UX.
            // Usually "g then h" works globally. 
            // Let's keep it simple for now: Open modal to see them, but they work globally.
        };

        // We need a more complex handler for sequence keys like "g then h"
        // For this MVP, let's just stick to the modal toggle first to avoid complex state.
        // Actually, let's add simple one-key or modifier shortcuts.
        // Or just "Shift + /" to show help. 

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const shortcuts = [
        { key: "?", description: "Toggle this help menu" },
        { key: "/", description: "Focus search (Dashboard)" },
        { key: "Esc", description: "Close modal / Clear search" },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
                    >
                        <div className="glass-card p-6 shadow-2xl relative mx-4">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Command className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
                            </div>

                            <div className="space-y-2">
                                {shortcuts.map((shortcut) => (
                                    <div
                                        key={shortcut.key}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                                    >
                                        <span className="text-sm text-foreground font-medium">
                                            {shortcut.description}
                                        </span>
                                        <kbd className="px-2.5 py-1.5 rounded-md bg-muted/50 border border-border text-xs font-mono font-bold text-foreground min-w-[32px] text-center shadow-sm">
                                            {shortcut.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-border/50 text-center">
                                <p className="text-xs text-muted-foreground">
                                    Press <kbd className="font-bold">Esc</kbd> to close
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
