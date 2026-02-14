"use client";

import { Info } from "lucide-react";

interface HelpTooltipProps {
  text: string;
}

export function HelpTooltip({ text }: HelpTooltipProps) {
  return (
    <div className="relative group inline-block">
      <Info className="w-4 h-4 text-gray-400 cursor-pointer" />

      <div className="absolute bottom-full mb-2 hidden group-hover:block
        bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
        {text}
      </div>
    </div>
  );
}
