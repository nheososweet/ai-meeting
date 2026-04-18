"use client";

import { useMemo, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";

import { HistoryHeaderMetrics } from "@/app/(main)/history/_components/HistoryHeaderMetrics";
import { HistoryRecordItem } from "@/app/(main)/history/_components/HistoryRecordItem";
import { ReportPreviewDialog } from "@/app/(main)/history/_components/ReportPreviewDialog";
import { SendEmailDialog } from "@/app/(main)/history/_components/SendEmailDialog";
import { TranscriptPreviewDialog } from "@/app/(main)/history/_components/TranscriptPreviewDialog";
import {
  historyDateTimeFormatter,
  resolveReportFilename,
} from "@/app/(main)/history/_lib/file-utils";
import { useHistoryEmail } from "@/app/(main)/history/_hooks/useHistoryEmail";
import { useHistoryToast } from "@/app/(main)/history/_hooks/useHistoryToast";
import { useHistoryTranscriptPreview } from "@/app/(main)/history/_hooks/useHistoryTranscriptPreview";
import { useRecordsQuery } from "@/hooks/services/use-records-query";
import type { PipelineRecord } from "@/services/pipeline-records.service";

export default function HistoryPage() {
  const [previewAudioRecordId, setPreviewAudioRecordId] = useState<
    number | null
  >(null);
  const [previewReportRecordId, setPreviewReportRecordId] = useState<
    number | null
  >(null);

  const recordsQuery = useRecordsQuery();
  const records = recordsQuery.data;

  const { actionToast, showActionToast } = useHistoryToast();

  const {
    previewTranscriptByRecord,
    loadingTranscriptRecordId,
    previewTranscriptRecordId,
    activeTranscriptRecord,
    handlePreviewTranscript,
    handleCopyTranscriptPreview,
    closeTranscriptPreview,
  } = useHistoryTranscriptPreview({
    records,
    showActionToast,
  });

  const {
    sendEmailRecordId,
    selectedSendEmailRecord,
    emailRecipientsInput,
    emailValidationError,
    isSendingEmail,
    handleOpenSendEmailDialog,
    handleSendEmailDialogOpenChange,
    handleEmailRecipientsInputChange,
    handleSendEmail,
  } = useHistoryEmail({
    records,
    showActionToast,
  });

  const recordMetrics = useMemo(() => {
    const list = records ?? [];

    return {
      total: list.length,
      withReport: list.filter((record) => Boolean(record.reportUrl)).length,
      withoutReport: list.filter((record) => !record.reportUrl).length,
    };
  }, [records]);

  const activeReportRecord = useMemo(() => {
    if (!previewReportRecordId) {
      return null;
    }

    return (
      records?.find((record) => record.id === previewReportRecordId) ?? null
    );
  }, [previewReportRecordId, records]);

  const activeReportFileName =
    activeReportRecord?.reportUrl && activeReportRecord.filename
      ? resolveReportFilename(
          activeReportRecord.filename,
          activeReportRecord.reportUrl,
        )
      : undefined;

  const activeTranscriptContent = previewTranscriptRecordId
    ? (previewTranscriptByRecord[previewTranscriptRecordId] ?? "")
    : "";

  function handleToggleAudioPreview(recordId: number) {
    setPreviewAudioRecordId((prev) => (prev === recordId ? null : recordId));
  }

  function handlePreviewReport(record: PipelineRecord) {
    if (!record.reportUrl) {
      return;
    }

    if (previewReportRecordId === record.id) {
      setPreviewReportRecordId(null);
      return;
    }

    setPreviewReportRecordId(record.id);
  }

  function handleReportDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setPreviewReportRecordId(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-border/80 bg-card p-5 shadow-sm lg:sticky lg:top-4 lg:h-[calc(100dvh-8.5rem)]">
        <HistoryHeaderMetrics
          total={recordMetrics.total}
          withReport={recordMetrics.withReport}
          withoutReport={recordMetrics.withoutReport}
        />

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-lg">
          {recordsQuery.isLoading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <LoaderCircleIcon className="size-4 animate-spin" />
              Đang tải danh sách bản ghi...
            </div>
          ) : recordsQuery.isError ? (
            <div className="p-4 text-sm text-rose-600 dark:text-rose-400">
              Không tải được danh sách bản ghi.
            </div>
          ) : records?.length ? (
            <div className="space-y-3 p-3">
              {records.map((record) => (
                <HistoryRecordItem
                  key={record.id}
                  record={record}
                  createdAtLabel={historyDateTimeFormatter.format(
                    new Date(record.createTime),
                  )}
                  previewAudioActive={previewAudioRecordId === record.id}
                  previewTranscriptActive={
                    previewTranscriptRecordId === record.id
                  }
                  previewReportActive={previewReportRecordId === record.id}
                  loadingTranscript={loadingTranscriptRecordId === record.id}
                  onToggleAudioPreview={handleToggleAudioPreview}
                  onPreviewTranscript={handlePreviewTranscript}
                  onPreviewReport={handlePreviewReport}
                  onOpenSendEmailDialog={handleOpenSendEmailDialog}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              Chưa có bản ghi nào.
            </div>
          )}
        </div>
      </section>

      <TranscriptPreviewDialog
        open={previewTranscriptRecordId !== null}
        transcriptRecordId={previewTranscriptRecordId}
        transcriptRecordFilename={activeTranscriptRecord?.filename}
        transcriptContent={activeTranscriptContent}
        isLoading={
          previewTranscriptRecordId !== null &&
          loadingTranscriptRecordId === previewTranscriptRecordId
        }
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeTranscriptPreview();
          }
        }}
        onCopyTranscript={handleCopyTranscriptPreview}
      />

      <ReportPreviewDialog
        open={previewReportRecordId !== null}
        reportRecordId={previewReportRecordId}
        reportRecordFilename={activeReportRecord?.filename}
        reportUrl={activeReportRecord?.reportUrl}
        reportFileName={activeReportFileName}
        onOpenChange={handleReportDialogOpenChange}
      />

      <SendEmailDialog
        open={sendEmailRecordId !== null}
        recordFilename={selectedSendEmailRecord?.filename}
        reportUrl={selectedSendEmailRecord?.reportUrl}
        emailRecipientsInput={emailRecipientsInput}
        emailValidationError={emailValidationError}
        isSendingEmail={isSendingEmail}
        onOpenChange={handleSendEmailDialogOpenChange}
        onEmailRecipientsInputChange={handleEmailRecipientsInputChange}
        onSendEmail={handleSendEmail}
      />

      {actionToast ? (
        <div className="pointer-events-none fixed right-4 bottom-4 z-50 rounded-lg border border-border/70 bg-background/95 px-3 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur">
          {actionToast}
        </div>
      ) : null}
    </div>
  );
}
