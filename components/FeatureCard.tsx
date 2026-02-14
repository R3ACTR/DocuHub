import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
    return (
        <div className="glass-card p-8 rounded-lg flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-transparent">
                <Icon className="w-10 h-10 text-[#4a5568] stroke-1" />
            </div>
            <div>
                <h3 className="text-xl font-semibold text-[#1e1e2e] mb-2">
                    {title}
                </h3>
                <p className="text-muted-foreground">
                    {description}
                </p>
            </div>
        </div>
    );
}
