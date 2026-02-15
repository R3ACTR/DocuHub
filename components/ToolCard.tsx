"use client";

import { Info, LucideIcon, ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  active?: boolean;
  disabled?: boolean;
}

export function ToolCard({
  icon: Icon,
  title,
  description,
  href,
  active,
  disabled
}: ToolCardProps) {
  if (disabled) {
    return (
      <div
        className={cn(
          "group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all",
          "opacity-50 cursor-not-allowed border-dashed"
        )}
      >
        <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">Coming Soon</span>
        </div>

        <div className="mb-4">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground flex items-center">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:bg-muted/50 hover:shadow-md",
        active ? "border-primary ring-1 ring-primary" : "border-border"
      )}
    >
      <div className="absolute right-4 top-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowRight className="h-5 w-5 -rotate-45 transition-transform group-hover:rotate-0" />
      </div>

      <div className="mb-4">
        <div className={cn(
          "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          active ? "bg-primary/10 text-primary" : "bg-primary/5 text-primary group-hover:bg-primary/10"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-foreground flex items-center">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>
    </Link>
  );
}
