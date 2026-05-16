import {
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleIcon,
  XCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PipelineStep, PipelineStepId } from "@/app/(main)/workspace/_lib/pipeline-constants";

type PipelineProgressCardProps = {
  stageProgress: number;
  pipelineSteps: PipelineStep[];
  canRetryPipeline: boolean;
  failedStepId: PipelineStep["id"] | null;
  onRetryPipeline: () => void;
  onRetryStep?: (stepId: PipelineStepId) => void;
};

export function PipelineProgressCard({
  stageProgress,
  pipelineSteps,
  canRetryPipeline,
  failedStepId,
  onRetryPipeline,
  onRetryStep,
}: PipelineProgressCardProps) {
  return (
    <>
      <div className="mt-4 rounded-lg border border-border/70 bg-secondary/50 p-3">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Tiến độ quy trình</span>
          <span>{stageProgress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${stageProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-border/70 bg-secondary/50 p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Chi tiết quy trình
          </h3>
        </div>
        {failedStepId ? (
          <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-300">
            Đã phát hiện lỗi ở bước: <span className="font-medium">{failedStepId}</span>. Nhấn &quot;Thử lại&quot; trên bước tương ứng để tiếp tục.
          </p>
        ) : null}
        <ul className="mt-3 space-y-2">
          {pipelineSteps.map((step) => {
            const statusMeta =
              step.status === "completed"
                ? {
                  icon: (
                    <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" />
                  ),
                  label: "Hoàn tất",
                }
                : step.status === "running"
                  ? {
                    icon: (
                      <CircleDashedIcon className="size-4 shrink-0 animate-spin text-amber-600" />
                    ),
                    label: "Đang chạy",
                  }
                  : step.status === "error"
                    ? {
                      icon: <XCircleIcon className="size-4 shrink-0 text-rose-600" />,
                      label: "Lỗi",
                    }
                    : {
                      icon: (
                        <CircleIcon className="size-4 shrink-0 text-muted-foreground/60" />
                      ),
                      label: "Chờ",
                    };

            const isFailedStep = step.status === "error" && failedStepId === step.id && canRetryPipeline;

            return (
              <li
                key={step.id}
                className="rounded-md border border-border/60 p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {statusMeta.icon}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {isFailedStep ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 shrink-0 px-2 text-[10px] text-rose-600 hover:text-rose-700 border-rose-300 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => {
                        if (step.id === "raw_transcript") {
                          onRetryPipeline();
                        } else {
                          onRetryStep?.(step.id);
                        }
                      }}
                    >
                      {step.id === "raw_transcript" ? "Thử lại từ đầu" : "Thử lại bước này"}
                    </Button>
                  ) : null}
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
