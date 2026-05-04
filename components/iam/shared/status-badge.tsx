import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { UserStatus } from "@/lib/types/iam"

const statusConfig: Record<UserStatus, { label: string; className: string }> = {
  active: {
    label: "Hoạt động",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  locked: {
    label: "Đã khóa",
    className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  },
}

export function StatusBadge({ status }: { status: UserStatus }) {
  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={cn("text-[11px] font-semibold", config.className)}>
      {config.label}
    </Badge>
  )
}
