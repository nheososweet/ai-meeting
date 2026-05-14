import { Loader2Icon } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4 gap-4">
        <div className="flex-1 min-w-0">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-border/40 bg-muted/5 p-4">
        <div className="h-9 w-full sm:w-[280px] animate-pulse rounded bg-muted" />
        <div className="h-9 w-[180px] animate-pulse rounded bg-muted" />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    </div>
  );
}
