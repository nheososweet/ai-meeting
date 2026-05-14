import type { ProcessingStatus } from "@/lib/types/meeting";

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes}m ${String(remainSeconds).padStart(2, "0")}s`;
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatHeaderTimestamp(header: string): string {
  return header.replace(/\(([\d.]+)s\s*-\s*([\d.]+)s\)/, (_, s1, s2) =>
    `(${formatTimestamp(parseFloat(s1))} - ${formatTimestamp(parseFloat(s2))})`
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function statusConfig(status: ProcessingStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "completed":
      return {
        label: "Hoàn tất",
        className:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
      };
    case "processing":
      return {
        label: "Đang xử lý",
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      };
    case "uploading":
      return {
        label: "Đang tải lên",
        className:
          "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
      };
    case "error":
      return {
        label: "Lỗi xử lý",
        className:
          "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
      };
    default:
      return {
        label: "Chờ thao tác",
        className:
          "bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-300",
      };
  }
}
