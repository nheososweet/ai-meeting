"use client";

import { StarIcon, UserIcon, MessageSquareQuoteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RecordEvaluation } from "@/lib/types/evaluation";

function resolveScoreColorClass(score: number): {
  border: string;
  bg: string;
  text: string;
  barBg: string;
} {
  if (score >= 8.0) {
    return {
      border: "border-l-emerald-500",
      bg: "bg-emerald-50/60 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-300",
      barBg: "bg-emerald-500",
    };
  }

  if (score >= 6.0) {
    return {
      border: "border-l-amber-500",
      bg: "bg-amber-50/60 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-300",
      barBg: "bg-amber-500",
    };
  }

  return {
    border: "border-l-rose-500",
    bg: "bg-rose-50/60 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-300",
    barBg: "bg-rose-500",
  };
}

function resolveScoreLabel(score: number): string {
  if (score >= 8.0) return "Tốt";
  if (score >= 6.0) return "Trung bình";
  return "Cần cải thiện";
}

type EvaluationDetailDialogProps = {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  evaluation: RecordEvaluation | null;
  recordFilename?: string;
};

export function EvaluationDetailDialog({
  open,
  onOpenChange,
  evaluation,
  recordFilename,
}: EvaluationDetailDialogProps) {
  if (!evaluation) {
    return null;
  }

  const overallColors = resolveScoreColorClass(evaluation.overallScore);
  const overallLabel = resolveScoreLabel(evaluation.overallScore);
  const progressPercent = Math.min((evaluation.overallScore / 10) * 100, 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="mb-2 flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col justify-between gap-0 overflow-hidden rounded-xl p-0 sm:mb-4 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)]"
      >
        <DialogHeader className="shrink-0 space-y-0 text-left">
          <DialogTitle className="px-5 pt-5 text-base sm:px-6 sm:pt-6">
            Chi tiết đánh giá
          </DialogTitle>
          <DialogDescription className="px-5 pb-3 text-xs sm:px-6">
            {recordFilename ?? "Bản ghi cuộc họp"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
          {/* Overall Score Section */}
          <div
            className={`rounded-lg border p-4 ${overallColors.bg} border-border/60`}
          >
            <div className="flex items-center gap-4">
              {/* Score circle */}
              <div className="relative flex size-16 shrink-0 items-center justify-center">
                {/* Background ring */}
                <svg
                  className="absolute inset-0 size-full -rotate-90"
                  viewBox="0 0 64 64"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-border/40"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${(progressPercent / 100) * 175.93} 175.93`}
                    strokeLinecap="round"
                    className={overallColors.text}
                    style={{
                      transition: "stroke-dasharray 0.6s ease-out",
                    }}
                  />
                </svg>
                <span
                  className={`relative text-lg font-bold ${overallColors.text}`}
                >
                  {evaluation.overallScore.toFixed(1)}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${overallColors.text}`}
                  >
                    {overallLabel}
                  </span>
                  <StarIcon
                    className={`size-4 fill-current ${overallColors.text}`}
                  />
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/30">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${overallColors.barBg}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {evaluation.overallComment}
                </p>
              </div>
            </div>
          </div>

          {/* Highlights Section */}
          <div className="mt-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <MessageSquareQuoteIcon className="size-4 text-primary" />
              Chi tiết từng đoạn transcript
            </h3>

            <div className="space-y-3">
              {evaluation.highlights.map((highlight) => {
                const hColors = resolveScoreColorClass(highlight.score);

                return (
                  <div
                    key={highlight.id}
                    className={`rounded-lg border border-l-4 border-border/60 bg-background p-4 transition-colors hover:bg-muted/20 ${hColors.border}`}
                  >
                    {/* Header: Speaker + Score */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <UserIcon className="size-3" />
                        {highlight.speaker}
                        {highlight.startSecond !== undefined ? (
                          <span className="ml-1.5 rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                            {Math.floor(highlight.startSecond / 60)}:
                            {String(highlight.startSecond % 60).padStart(2, "0")}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${hColors.bg} ${hColors.text} border-current/20`}
                      >
                        <StarIcon className="size-3 fill-current" />
                        {highlight.score.toFixed(1)}
                      </span>
                    </div>

                    {/* Transcript text */}
                    <p
                      className={`mt-2 rounded-md px-3 py-2 text-sm leading-relaxed text-foreground ${hColors.bg}`}
                    >
                      &ldquo;{highlight.segmentText}&rdquo;
                    </p>

                    {/* Reason */}
                    <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground">
                      💡 {highlight.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 mx-0 mb-0 rounded-none border-t px-5 pb-4 pt-4 sm:px-6 sm:pb-6 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Đóng
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
