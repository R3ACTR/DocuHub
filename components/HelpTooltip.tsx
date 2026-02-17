"use client";

import { Info } from "lucide-react";
import { useState } from "react";

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
          className="absolute left-0 top-6 z-20 w-72 rounded-lg border bg-card p-3 text-sm text-foreground shadow-md"
        >
          {text}
        </div>
      )}
    </span>
  );
}

