"use client";

import { ArrowRight, LucideIcon } from "lucide-react";
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
  if (disabled) {
    return (
      <div
        className={cn(
          "group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all",
          "opacity-50 cursor-not-allowed border-dashed"
        )}
      >
        <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
            Coming Soon
          </span>
        </div>

        <div className="mb-4">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
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
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300",
        active
          ? "border-primary ring-1 ring-primary shadow-premium"
          : "border-border/60 hover:border-primary/50 hover:shadow-premium-hover hover:-translate-y-1"
      )}
    >
      <div className="absolute right-4 top-4 text-primary opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowRight
          className="h-5 w-5 -rotate-45 transition-transform group-hover:rotate-0"
          aria-hidden="true"
        />
      </div>

      <div className="mb-4">
        <div
          className={cn(
            "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
            active
              ? "bg-primary/10 text-primary"
              : "bg-primary/5 text-primary group-hover:bg-primary/10"
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>
    </Link>
  );
}
