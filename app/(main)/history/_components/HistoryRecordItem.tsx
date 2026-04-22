import {
  AudioLinesIcon,
  DownloadIcon,
  FileTextIcon,
  MailIcon,
  ShieldCheckIcon,
} from "lucide-react";

import {
  buildDownloadUrl,
  resolveReportFilename,
  resolveTranscriptFilename,
} from "@/app/(main)/history/_lib/file-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PipelineRecord } from "@/services/pipeline-records.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  onOpenEvaluation: (record: PipelineRecord) => void;
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
  onOpenEvaluation,
}: HistoryRecordItemProps) {
  const scoreValue = record.score ? parseFloat(record.score) : null;

  return (
    <div
      className={`group relative flex flex-col gap-4 rounded-xl border border-border/50 bg-background p-4 transition-all hover:shadow-md ${
        record.reportUrl
          ? "border-l-4 border-l-primary"
          : "border-l-4 border-l-amber-500"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left: Score Badge Only */}
        <div className="flex items-center gap-4 shrink-0">
          {scoreValue !== null && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEvaluation(record);
                    }}
                    className={`flex flex-col items-center justify-center rounded-lg px-3 py-2 min-w-[64px] transition-all hover:scale-105 ${
                      scoreValue >= 8
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : scoreValue >= 5
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                          : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <ShieldCheckIcon className="size-3" />
                      <span className="text-sm font-black">{record.score}</span>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Xem chi tiết đánh giá chất lượng</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Center: File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <h2
              className="truncate text-base font-bold text-foreground group-hover:text-blue-600 transition-colors"
              title={record.filename}
            >
              {record.filename}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                {createdAtLabel}
                <span className="opacity-40">•</span>
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">ID: {record.id}</span>
              </span>
              {!record.reportUrl && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                  Chưa có biên bản
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right: Download Actions (Subtle) */}
        <div className="flex items-center gap-1.5 md:justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={buildDownloadUrl(record.audioUrl)}
                  download={record.filename}
                  className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                >
                  <DownloadIcon className="size-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent>Tải Audio</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={buildDownloadUrl(record.transcribeUrl)}
                  download={resolveTranscriptFilename(record.filename)}
                  className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                >
                  <FileTextIcon className="size-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent>Tải Transcript</TooltipContent>
            </Tooltip>

            {record.reportUrl && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={buildDownloadUrl(record.reportUrl)}
                    download={resolveReportFilename(record.filename, record.reportUrl)}
                    className="p-2 rounded-full hover:bg-muted text-emerald-600 transition-colors"
                  >
                    <DownloadIcon className="size-4" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>Tải Biên bản (.docx)</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>

      {/* Bottom Row: Primary Actions (Grouped) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleAudioPreview(record.id)}
            className={`h-8 rounded-full gap-1.5 text-xs font-semibold ${
              previewAudioActive ? "bg-blue-50 text-blue-600 border-blue-200" : ""
            }`}
          >
            <AudioLinesIcon className="size-3.5" />
            {previewAudioActive ? "Đang nghe" : "Nghe thử"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreviewTranscript(record)}
            disabled={loadingTranscript}
            className={`h-8 rounded-full gap-1.5 text-xs font-semibold ${
              previewTranscriptActive ? "bg-blue-50 text-blue-600 border-blue-200" : ""
            }`}
          >
            <FileTextIcon className="size-3.5" />
            {loadingTranscript ? "Đang tải..." : "Xem Transcript"}
          </Button>

          {record.reportUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreviewReport(record)}
              className={`h-8 rounded-full gap-1.5 text-xs font-semibold ${
                previewReportActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : ""
              }`}
            >
              <FileTextIcon className="size-3.5" />
              Xem Biên bản
            </Button>
          )}
        </div>

        {record.reportUrl && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenSendEmailDialog(record.id)}
            className="h-8 rounded-full gap-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700"
          >
            <MailIcon className="size-3.5" />
            Gửi Email
          </Button>
        )}
      </div>

      {/* Expandable Audio Preview */}
      {previewAudioActive && (
        <div className="mt-2 rounded-xl bg-muted/30 p-3 ring-1 ring-border/50">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
            Trình phát Audio nhanh
          </p>
          <audio
            controls
            autoPlay
            src={record.audioUrl}
            className="h-10 w-full"
          >
            Trình duyệt không hỗ trợ.
          </audio>
        </div>
      )}
    </div>
  );
}
