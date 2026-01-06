import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: "primary" | "success" | "warning" | "destructive";
  href?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "primary",
  href,
}: StatsCardProps) {
  const iconColorClasses = {
    primary: "bg-primary/10 text-primary glow-primary",
    success: "bg-success/10 text-success glow-success",
    warning: "bg-warning/10 text-warning glow-warning",
    destructive: "bg-destructive/10 text-destructive glow-destructive",
  };

  const changeColorClasses = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  };

  const cardContent = (
    <div className={cn(
      "group relative rounded-xl border border-border bg-card p-6 transition-all duration-300",
      href ? "hover:border-primary/30 hover:shadow-lg cursor-pointer" : "hover:border-primary/30 hover:shadow-lg"
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={cn("text-sm font-medium", changeColorClasses[changeType])}>
              {change}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
            iconColorClasses[iconColor]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{cardContent}</Link>;
  }

  return cardContent;
}
