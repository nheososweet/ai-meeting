import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { JobStatus } from "@/lib/types/wbs"

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  pending: {
    label: "Chờ xử lý",
    className: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100",
  },
  in_progress: {
    label: "Đang thực hiện",
    className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  review: {
    label: "Đang duyệt",
    className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  done: {
    label: "Hoàn thành",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
}

export function WbsStatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={cn("text-xs font-semibold whitespace-nowrap", config.className, className)}>
      {config.label}
    </Badge>
  )
}
