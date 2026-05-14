import { FolderOpenIcon, Loader2Icon } from "lucide-react"

interface EmptyStateProps {
  loading?: boolean
  loadingText?: string
  emptyText?: string
  icon?: React.ReactNode
}

export function EmptyState({
  loading = false,
  loadingText = "Đang tải dữ liệu...",
  emptyText = "Không có dữ liệu.",
  icon,
}: EmptyStateProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        <Loader2Icon className="mb-3 size-6 animate-spin text-primary/70" />
        <p>{loadingText}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
      {icon ?? <FolderOpenIcon className="mb-3 size-8 text-muted-foreground/50" />}
      <p>{emptyText}</p>
    </div>
  )
}
