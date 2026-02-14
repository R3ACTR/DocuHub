import { ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";

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
  disabled,
  active,
}: ToolCardProps) {
  return (
    <Link
      href={disabled ? "#" : href}
      className={`group relative flex items-center justify-between p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 ease-out
      ${
        active
          ? "border-primary bg-primary/10 shadow-md"
          : `
            border-border
            bg-card
            hover:bg-muted
            hover:shadow-xl hover:-translate-y-1
          `
      }
      ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl text-muted-foreground">
          <Icon className="h-6 w-6 stroke-1" />
        </div>

        <div>
          <h3 className="text-lg font-medium text-foreground">{title}</h3>

          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <ArrowRight
        className="h-5 w-5 text-muted-foreground opacity-0 translate-x-2 transition-all group-hover:opacity-100"
      />
    </Link>
  );
}
