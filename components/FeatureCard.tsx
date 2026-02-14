import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="glass-card p-8 rounded-2xl flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className="p-3">
        <Icon className="w-10 h-10 text-muted-foreground stroke-1" />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {title}
        </h3>

        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
