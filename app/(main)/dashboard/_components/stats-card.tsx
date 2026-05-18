import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  className?: string;
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  isLoading,
}: StatsCardProps) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="space-y-1 w-full">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {value}
              </h3>
            )}
            {trend && !isLoading && (
              <span className={cn(
                "text-xs font-bold",
                trend.isUp ? "text-emerald-600" : "text-rose-600"
              )}>
                {trend.isUp ? "+" : "-"}{trend.value}
              </span>
            )}
          </div>
          {description && (
            <div className="mt-1">
              {isLoading ? (
                <Skeleton className="h-3 w-3/4" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
          <Icon className="size-6" />
        </div>
      </div>
      
      {/* Subtle decorative background element */}
      <div className="absolute -right-4 -bottom-4 size-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
    </div>
  );
}
