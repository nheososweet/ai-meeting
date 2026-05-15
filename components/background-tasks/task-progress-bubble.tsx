"use client";

import { useState } from "react";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
  XIcon,
  AudioLinesIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBackgroundTask } from "@/hooks/use-background-task";
import { Progress } from "@/components/ui/progress";
import type { BackgroundTaskItem, MeetingPipelineSteps, PipelineStepStatus, UploadPipelineSteps } from "@/lib/types/background-tasks";

// ─── Step icon helper ────────────────────────────────────────────────────────

function StepIcon({ status, label }: { status: PipelineStepStatus; label: string }) {
  return (
    <span title={label} className="flex items-center gap-0.5">
      {status === "success" ? (
        <CheckCircle2Icon className="size-3 text-emerald-500" />
      ) : status === "processing" ? (
        <Loader2Icon className="size-3 text-blue-500 animate-spin" />
      ) : status === "failed" ? (
        <XCircleIcon className="size-3 text-rose-500" />
      ) : (
        <ClockIcon className="size-3 text-slate-300" />
      )}
      <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
    </span>
  );
}

// ─── Per-task row ────────────────────────────────────────────────────────────

const UPLOAD_STEP_LABELS: Record<keyof UploadPipelineSteps, string> = {
  upload:     "Tải lên",
  transcribe: "Bản gỡ",
  summary:    "Tóm tắt",
  report:     "Biên bản",
  sendEmail:  "Email",
};

const MEETING_STEP_LABELS: Record<keyof MeetingPipelineSteps, string> = {
  raw_transcript:  "Gỡ băng",
  diarization:     "Phân vai",
  speaker_summary: "Tóm tắt",
  minutes:         "Biên bản",
};

function TaskItemRow({ task, onRemove }: { task: BackgroundTaskItem; onRemove: () => void }) {
  const isDone     = task.status === "completed";
  const isFailed   = task.status === "failed";
  const isRunning  = task.status === "running";
  const canDismiss = isDone || isFailed;
  const uploadSteps  = task.type === "upload_file"      ? task.steps as UploadPipelineSteps | undefined  : undefined;
  const meetingSteps = task.type === "meeting_pipeline" ? task.steps as MeetingPipelineSteps | undefined : undefined;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-background p-2.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <AudioLinesIcon className="size-3.5 shrink-0 text-primary/70" />
          <span className="text-xs font-medium text-foreground truncate" title={task.label}>
            {task.label}
          </span>
        </div>
        {canDismiss && (
          <button
            onClick={onRemove}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <XIcon className="size-3" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {isRunning && task.type === "upload_file" ? (
        // Indeterminate animation khi đang HTTP upload
        <div className="relative h-1 w-full rounded-full bg-muted overflow-hidden">
          <div className="absolute inset-y-0 w-1/3 rounded-full bg-blue-500 animate-[slide_1.5s_ease-in-out_infinite]" />
        </div>
      ) : (
        <Progress
          value={task.progress}
          className={cn(
            "h-1",
            isDone   && "[&>[data-slot=progress-indicator]]:bg-emerald-500",
            isFailed && "[&>[data-slot=progress-indicator]]:bg-rose-500",
          )}
        />
      )}

      {/* Status text */}
      <p className={cn(
        "text-[10px] leading-none",
        isDone   ? "text-emerald-600" :
        isFailed ? "text-rose-600"    :
                   "text-muted-foreground"
      )}>
        {isDone   ? "Hoàn tất" :
         isFailed ? (task.errorMessage ?? "Đã xảy ra lỗi") :
         isRunning && task.type === "upload_file" ? "Đang tải lên..." :
                     "Đang xử lý..."}
      </p>

      {/* Pipeline steps */}
      {uploadSteps && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
          {(Object.keys(UPLOAD_STEP_LABELS) as (keyof UploadPipelineSteps)[]).map(key => (
            <StepIcon key={key} status={uploadSteps[key]} label={UPLOAD_STEP_LABELS[key]} />
          ))}
        </div>
      )}
      {meetingSteps && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
          {(Object.keys(MEETING_STEP_LABELS) as (keyof MeetingPipelineSteps)[]).map(key => (
            <StepIcon key={key} status={meetingSteps[key]} label={MEETING_STEP_LABELS[key]} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Bubble ─────────────────────────────────────────────────────────────

export function TaskProgressBubble() {
  const { tasks, removeTask } = useBackgroundTask();
  const [expanded, setExpanded] = useState(true);

  if (tasks.length === 0) return null;

  const hasRunning = tasks.some(t => t.status === "running" || t.status === "polling");
  const allDone    = tasks.every(t => t.status === "completed");

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {/* Expanded panel */}
      {expanded && (
        <div className="w-80 rounded-xl border border-border/80 bg-card shadow-lg overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-1.5">
              {hasRunning
                ? <Loader2Icon className="size-3.5 text-blue-500 animate-spin" />
                : <CheckCircle2Icon className="size-3.5 text-emerald-500" />
              }
              <span className="text-xs font-semibold text-foreground">Tác vụ nền</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                {tasks.length}
              </span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ChevronDownIcon className="size-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto p-2">
            {tasks.map(task => (
              <TaskItemRow
                key={task.id}
                task={task}
                onRemove={() => removeTask(task.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Collapsed trigger */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-lg text-xs font-semibold transition-colors",
            allDone
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "border-border bg-card text-foreground hover:bg-muted/50"
          )}
        >
          {hasRunning
            ? <Loader2Icon className="size-3.5 text-blue-500 animate-spin" />
            : <CheckCircle2Icon className="size-3.5 text-emerald-500" />
          }
          <span>Tác vụ nền</span>
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            allDone
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
              : "bg-muted text-muted-foreground"
          )}>
            {tasks.length}
          </span>
          <ChevronUpIcon className="size-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
