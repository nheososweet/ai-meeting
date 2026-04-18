import {
  AudioLinesIcon,
  DownloadIcon,
  FileTextIcon,
  MailIcon,
} from "lucide-react";

import {
  buildDownloadUrl,
  resolveReportFilename,
  resolveTranscriptFilename,
} from "@/app/(main)/history/_lib/file-utils";
import type { PipelineRecord } from "@/services/pipeline-records.service";

type HistoryRecordItemProps = {
  record: PipelineRecord;
  createdAtLabel: string;
  previewAudioActive: boolean;
  previewTranscriptActive: boolean;
  previewReportActive: boolean;
  loadingTranscript: boolean;
  onToggleAudioPreview: (recordId: number) => void;
  onPreviewTranscript: (record: PipelineRecord) => void;
  onPreviewReport: (record: PipelineRecord) => void;
  onOpenSendEmailDialog: (recordId: number) => void;
};

export function HistoryRecordItem({
  record,
  createdAtLabel,
  previewAudioActive,
  previewTranscriptActive,
  previewReportActive,
  loadingTranscript,
  onToggleAudioPreview,
  onPreviewTranscript,
  onPreviewReport,
  onOpenSendEmailDialog,
}: HistoryRecordItemProps) {
  return (
    <div
      className={`grid gap-3 rounded-md border border-border/70 border-l-4 bg-background p-4 transition-colors hover:bg-muted/20 ${
        record.reportUrl
          ? "border-l-emerald-500/70"
          : "border-l-muted-foreground/30"
      }`}
    >
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className="max-w-full truncate text-sm font-semibold text-foreground"
              title={record.filename}
            >
              {record.filename}
            </h2>
            <span className="rounded-md border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
              ID #{record.id}
            </span>
            {!record.reportUrl ? (
              <span className="rounded-md border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                Chưa có biên bản
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Tạo lúc {createdAtLabel}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5 md:flex-nowrap md:justify-end">
          <a
            href={buildDownloadUrl(record.audioUrl)}
            download={record.filename}
            className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <DownloadIcon className="size-3.5" />
            Tải âm thanh
          </a>
          <a
            href={buildDownloadUrl(record.transcribeUrl)}
            download={resolveTranscriptFilename(record.filename)}
            className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <DownloadIcon className="size-3.5" />
            Tải transcript
          </a>
          {record.reportUrl ? (
            <a
              href={buildDownloadUrl(record.reportUrl)}
              download={resolveReportFilename(
                record.filename,
                record.reportUrl,
              )}
              className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              <DownloadIcon className="size-3.5" />
              Tải biên bản
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleAudioPreview(record.id)}
          className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <AudioLinesIcon className="size-3.5" />
          {previewAudioActive ? "Ẩn nghe thử" : "Nghe thử"}
        </button>

        <button
          type="button"
          onClick={() => onPreviewTranscript(record)}
          className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loadingTranscript}
        >
          <FileTextIcon className="size-3.5" />
          {loadingTranscript
            ? "Đang tải transcript..."
            : previewTranscriptActive
              ? "Ẩn transcript"
              : "Xem transcript"}
        </button>

        {record.reportUrl ? (
          <button
            type="button"
            onClick={() => onPreviewReport(record)}
            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <FileTextIcon className="size-3.5" />
            {previewReportActive ? "Ẩn biên bản" : "Xem biên bản"}
          </button>
        ) : null}

        {record.reportUrl ? (
          <button
            type="button"
            onClick={() => onOpenSendEmailDialog(record.id)}
            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <MailIcon className="size-3.5" />
            Gửi email
          </button>
        ) : null}
      </div>

      {previewAudioActive ? (
        <div className="rounded-md border border-border/70 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Nghe thử tệp âm thanh
          </p>
          <audio
            controls
            preload="none"
            src={record.audioUrl}
            className="w-full"
          >
            Trình duyệt không hỗ trợ phát audio.
          </audio>
        </div>
      ) : null}
    </div>
  );
}
