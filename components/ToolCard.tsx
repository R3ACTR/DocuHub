"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
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
