import { StarIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function resolveScoreColor(score: number): {
  bg: string;
  border: string;
  text: string;
  star: string;
} {
  if (score >= 8.0) {
    return {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-300/70 dark:border-emerald-700/60",
      text: "text-emerald-700 dark:text-emerald-300",
      star: "text-emerald-500 dark:text-emerald-400",
    };
  }

  if (score >= 6.0) {
    return {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-300/70 dark:border-amber-700/60",
      text: "text-amber-700 dark:text-amber-300",
      star: "text-amber-500 dark:text-amber-400",
    };
  }

  return {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-300/70 dark:border-rose-700/60",
    text: "text-rose-700 dark:text-rose-300",
    star: "text-rose-500 dark:text-rose-400",
  };
}

type ScoreBadgeProps = {
  score: number | null | undefined;
  onClick: () => void;
};

export function ScoreBadge({ score, onClick }: ScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground/60">
        <StarIcon className="size-3 opacity-40" />
        Chưa chấm
      </span>
    );
  }

  const colors = resolveScoreColor(score);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95 cursor-pointer ${colors.bg} ${colors.border} ${colors.text}`}
        >
          <StarIcon className={`size-3.5 fill-current ${colors.star}`} />
          {score.toFixed(1)}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        Xem chi tiết đánh giá
      </TooltipContent>
    </Tooltip>
  );
}
