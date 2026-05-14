"use client"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"
import type { JobStatus } from "@/lib/types/wbs"

const steps: { status: JobStatus; label: string }[] = [
  { status: "pending", label: "Chờ xử lý" },
  { status: "in_progress", label: "Đang thực hiện" },
  { status: "review", label: "Đang duyệt" },
  { status: "done", label: "Hoàn thành" },
]

interface WorkflowStepperProps {
  currentStatus: JobStatus
  className?: string
}

export function WorkflowStepper({ currentStatus, className }: WorkflowStepperProps) {
  const currentIndex = steps.findIndex((s) => s.status === currentStatus)

  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, index) => {
        const isPast = index < currentIndex
        const isCurrent = index === currentIndex
        const isLast = index === steps.length - 1

        return (
          <div key={step.status} className="flex items-center">
            {/* Step Node */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                  isPast
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-primary text-primary"
                      : "border-muted-foreground/30 text-muted-foreground/50"
                )}
              >
                {isPast ? <CheckIcon className="size-3" /> : <span>{index + 1}</span>}
              </div>
            </div>

            {/* Step Label (Optional tooltip or text below, for simplicity we just show the line) */}
            
            {/* Connecting Line */}
            {!isLast && (
              <div
                className={cn(
                  "h-[2px] w-8 mx-1 transition-colors",
                  isPast ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
