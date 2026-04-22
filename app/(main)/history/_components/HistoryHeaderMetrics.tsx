export type FilterType = "all" | "completed" | "pending";

type HistoryHeaderMetricsProps = {
  total: number;
  withReport: number;
  withoutReport: number;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
};

export function HistoryHeaderMetrics({
  total,
  withReport,
  withoutReport,
  activeFilter,
  onFilterChange,
}: HistoryHeaderMetricsProps) {
  return (
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Lịch sử cuộc họp
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Xem lại các bản ghi đã xử lý, tải tệp và gửi biên bản qua email.
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={`cursor-pointer rounded-md border px-2 py-1 transition-colors ${
            activeFilter === "all"
              ? "border-slate-500 bg-slate-500/10 font-medium text-slate-700 dark:text-slate-300"
              : "border-border/70 bg-muted/40 hover:bg-muted/80"
          }`}
        >
          Tổng bản ghi: {total}
        </button>
        <button
          type="button"
          onClick={() => onFilterChange("completed")}
          className={`cursor-pointer rounded-md border px-2 py-1 transition-colors ${
            activeFilter === "completed"
              ? "border-primary bg-primary/10 font-medium text-primary"
              : "border-border/70 bg-muted/40 hover:bg-muted/80"
          }`}
        >
          Đã có biên bản: {withReport}
        </button>
        <button
          type="button"
          onClick={() => onFilterChange("pending")}
          className={`cursor-pointer rounded-md border px-2 py-1 transition-colors ${
            activeFilter === "pending"
              ? "border-amber-500 bg-amber-500/10 font-medium text-amber-600 dark:text-amber-400"
              : "border-border/70 bg-muted/40 hover:bg-muted/80"
          }`}
        >
          Chưa có biên bản: {withoutReport}
        </button>
      </div>
    </div>
  );
}
