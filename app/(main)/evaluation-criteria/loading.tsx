import { LoaderCircleIcon } from "lucide-react";

export default function EvaluationCriteriaLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-border/80 bg-card p-5 shadow-sm">
        <div className="shrink-0">
          <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-muted/60" />
        </div>
        <div className="mt-4 flex min-h-0 flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircleIcon className="size-4 animate-spin" />
            Đang tải trang tiêu chí đánh giá...
          </div>
        </div>
      </section>
    </div>
  );
}
