"use client";

import { LucideIcon, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
  active?: boolean;
}

export function ToolCard({
  icon: Icon,
  title,
  description,
  href,
  disabled = false,
  active = false,
}: ToolCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={disabled ? "#" : href}
      onClick={(e) => disabled && e.preventDefault()}
      className={`
        group relative block p-6 rounded-xl border transition-all duration-200
        ${disabled 
          ? "opacity-50 cursor-not-allowed bg-muted/30 border-border" 
          : active 
            ? "bg-primary/5 border-primary shadow-sm" 
            : "bg-card border-border hover:border-primary/50 hover:shadow-md hover:bg-muted/50"
        }
      `}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
    >
      <div className="flex items-start gap-4">
        <div 
          className={`
            p-3 rounded-lg transition-colors
            ${disabled 
              ? "bg-muted" 
              : active 
                ? "bg-primary/10" 
                : "bg-muted group-hover:bg-primary/10"
            }
          `}
        >
          <Icon 
            className={`
              w-6 h-6 transition-colors
              ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}
            `} 
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1 truncate">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>

        {!disabled && (
          <span 
            className={`
              text-lg transition-all duration-200
              ${isHovered ? "translate-x-1 opacity-100" : "opacity-0 -translate-x-2"}
            `}
          >
            →
          </span>
        )}
      </div>
    </Link>
  );
}

type HelpTooltipProps = {
  text: string;
};

export function HelpTooltip({ text }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Tool help"
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="ml-2 text-muted-foreground
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-primary
          focus-visible:ring-offset-2
          focus-visible:ring-offset-background"
      >
        <Info className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute left-0 top-6 z-20 w-72 rounded-lg border bg-white p-3 text-sm text-[#1e1e2e] shadow-md"
        >
          {text}
        </div>
      )}
    </span>
  );
}
