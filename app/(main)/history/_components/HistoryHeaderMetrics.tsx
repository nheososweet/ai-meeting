type HistoryHeaderMetricsProps = {
  total: number;
  withReport: number;
  withoutReport: number;
};

export function HistoryHeaderMetrics({
  total,
  withReport,
  withoutReport,
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
        <span className="rounded-md border border-border/70 bg-muted/40 px-2 py-1">
          Tổng bản ghi: {total}
        </span>
        <span className="rounded-md border border-border/70 bg-muted/40 px-2 py-1">
          Đã có biên bản: {withReport}
        </span>
        <span className="rounded-md border border-border/70 bg-muted/40 px-2 py-1">
          Chưa có biên bản: {withoutReport}
        </span>
      </div>
    </div>
  );
}
