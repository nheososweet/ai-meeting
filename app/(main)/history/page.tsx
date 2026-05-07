"use client";

import { useMemo, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { HistoryHeaderMetrics, type FilterType } from "@/app/(main)/history/_components/HistoryHeaderMetrics";
import { HistoryRecordItem } from "@/app/(main)/history/_components/HistoryRecordItem";
import { ReportPreviewDialog } from "@/app/(main)/history/_components/ReportPreviewDialog";
import { SendEmailDialog } from "@/app/(main)/history/_components/SendEmailDialog";
import { TranscriptPreviewDialog } from "@/app/(main)/history/_components/TranscriptPreviewDialog";
import { HistorySpeakersLabelingDialog } from "@/app/(main)/history/_components/HistorySpeakersLabelingDialog";
import {
  historyDateTimeFormatter,
  resolveReportFilename,
} from "@/app/(main)/history/_lib/file-utils";
import { reformatTranscriptTimestamps } from "@/app/(main)/workspace/_lib/transcript-utils";
import { useHistoryEmail } from "@/app/(main)/history/_hooks/useHistoryEmail";
import { useHistoryToast } from "@/app/(main)/history/_hooks/useHistoryToast";
import { useHistoryTranscriptPreview } from "@/app/(main)/history/_hooks/useHistoryTranscriptPreview";
import { useRecordsQuery } from "@/hooks/services/use-records-query";
import type { PipelineRecord } from "@/services/pipeline-records.service";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/iam/shared/permission-guard";

export default function HistoryPage() {
  const [previewAudioRecordId, setPreviewAudioRecordId] = useState<
    number | null
  >(null);
  const [previewReportRecordId, setPreviewReportRecordId] = useState<
    number | null
  >(null);
  const [isLabelingDialogOpen, setIsLabelingDialogOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const recordsQuery = useRecordsQuery({ page, size: pageSize });
  const records = recordsQuery.data?.data;
  const meta = recordsQuery.data?.meta;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeFilter = (searchParams.get("filter") as FilterType) || "all";

  function handleFilterChange(newFilter: FilterType) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter", newFilter);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    if (activeFilter === "completed") {
      return records.filter((r) => Boolean(r.reportUrl));
    }
    if (activeFilter === "pending") {
      return records.filter((r) => !r.reportUrl);
    }
    return records;
  }, [records, activeFilter]);

  const { actionToast, showActionToast } = useHistoryToast();

  const {
    previewTranscriptByRecord,
    loadingTranscriptRecordId,
    previewTranscriptRecordId,
    activeTranscriptRecord,
    handlePreviewTranscript,
    handleCopyTranscriptPreview,
    closeTranscriptPreview,
    setPreviewTranscriptByRecord,
  } = useHistoryTranscriptPreview({
    records,
    showActionToast,
  });

  const {
    sendEmailRecordId,
    selectedSendEmailRecord,
    emailRecipientsInput,
    emailSubjectInput,
    emailBodyInput,
    emailIsHtml,
    emailValidationError,
    emailTemplateValidationError,
    isSendingEmail,
    handleOpenSendEmailDialog,
    handleSendEmailDialogOpenChange,
    handleEmailRecipientsInputChange,
    handleEmailSubjectInputChange,
    handleEmailBodyInputChange,
    handleEmailIsHtmlChange,
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

  const activeTranscriptContent = useMemo(() => {
    const raw = previewTranscriptRecordId
      ? (previewTranscriptByRecord[previewTranscriptRecordId] ?? "")
      : "";
    return reformatTranscriptTimestamps(raw);
  }, [previewTranscriptRecordId, previewTranscriptByRecord]);

  function handleToggleAudioPreview(recordId: number) {
    setPreviewAudioRecordId((prev) => (prev === recordId ? null : recordId));
  }

  function handleLabelingSuccess(newRawTranscript: string) {
    if (previewTranscriptRecordId) {
      setPreviewTranscriptByRecord((prev) => ({
        ...prev,
        [previewTranscriptRecordId]: newRawTranscript,
      }));
    }
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
    <PermissionGuard permission="view_records">
      <div className="flex min-h-0 flex-1 flex-col">
      <section className="flex min-h-0 flex-col rounded-lg border border-border/80 bg-card p-4 sm:p-5 shadow-sm h-[calc(100dvh-6rem)] md:h-[calc(100dvh-8.5rem)]">
        <HistoryHeaderMetrics
          total={recordMetrics.total}
          withReport={recordMetrics.withReport}
          withoutReport={recordMetrics.withoutReport}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-md border border-border/40 bg-muted/10">
          {recordsQuery.isLoading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <LoaderCircleIcon className="size-4 animate-spin" />
              Đang tải danh sách bản ghi...
            </div>
          ) : recordsQuery.isError ? (
            <div className="p-4 text-sm text-rose-600 dark:text-rose-400">
              Không tải được danh sách bản ghi.
            </div>
          ) : filteredRecords.length ? (
            <div className="space-y-3 p-3">
              {filteredRecords.map((record) => (
                <HistoryRecordItem
                  key={record.id}
                  record={record}
                  createdAtLabel={historyDateTimeFormatter.format(
                    new Date(new Date(record.createTime).getTime() + 7 * 60 * 60 * 1000),
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

        {/* Pagination Controls */}
        {meta && meta.total_pages > 1 && (
          <div className="mt-4 flex items-center justify-between py-2 border-t border-border/40">
            <div className="text-xs text-muted-foreground">
              Hiển thị <span className="font-medium text-foreground">{(meta.page - 1) * meta.page_size + 1}</span> - <span className="font-medium text-foreground">{Math.min(meta.page * meta.page_size, meta.total_items)}</span> trong <span className="font-medium text-foreground">{meta.total_items}</span> bản ghi
            </div>
            
            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={(e) => {
                      e.preventDefault()
                      if (meta.has_prev) setPage(p => p - 1)
                    }}
                    className={cn("cursor-pointer", !meta.has_prev && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                
                {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map((p) => {
                  if (p === 1 || p === meta.total_pages || (p >= meta.page - 1 && p <= meta.page + 1)) {
                    return (
                      <PaginationItem key={p}>
                        <PaginationLink 
                          isActive={p === meta.page}
                          onClick={(e) => {
                            e.preventDefault()
                            setPage(p)
                          }}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  }
                  if (p === meta.page - 2 || p === meta.page + 2) {
                    return <PaginationItem key={p}><PaginationEllipsis /></PaginationItem>
                  }
                  return null
                })}

                <PaginationItem>
                  <PaginationNext 
                    onClick={(e) => {
                      e.preventDefault()
                      if (meta.has_next) setPage(p => p + 1)
                    }}
                    className={cn("cursor-pointer", !meta.has_next && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
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
        onOpenLabeling={() => setIsLabelingDialogOpen(true)}
      />

      <HistorySpeakersLabelingDialog
        open={isLabelingDialogOpen}
        onOpenChange={setIsLabelingDialogOpen}
        recordId={previewTranscriptRecordId ?? 0}
        rawTranscript={
          previewTranscriptRecordId
            ? (previewTranscriptByRecord[previewTranscriptRecordId] ?? "")
            : ""
        }
        onSuccess={handleLabelingSuccess}
        showActionToast={(msg) => showActionToast(msg)}
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
        emailSubjectInput={emailSubjectInput}
        emailBodyInput={emailBodyInput}
        emailIsHtml={emailIsHtml}
        emailRecipientsInput={emailRecipientsInput}
        emailValidationError={emailValidationError}
        emailTemplateValidationError={emailTemplateValidationError}
        isSendingEmail={isSendingEmail}
        onOpenChange={handleSendEmailDialogOpenChange}
        onEmailSubjectInputChange={handleEmailSubjectInputChange}
        onEmailBodyInputChange={handleEmailBodyInputChange}
        onEmailIsHtmlChange={handleEmailIsHtmlChange}
        onEmailRecipientsInputChange={handleEmailRecipientsInputChange}
        onSendEmail={handleSendEmail}
      />

      {actionToast ? (
        <div
          className={`pointer-events-none fixed right-4 bottom-4 z-50 rounded-lg border px-3 py-2 text-xs font-medium shadow-lg backdrop-blur ${
            actionToast.variant === "success"
              ? "border-emerald-300/70 bg-emerald-50/95 text-emerald-900"
              : actionToast.variant === "error"
                ? "border-rose-300/70 bg-rose-50/95 text-rose-900"
                : "border-border/70 bg-background/95 text-foreground"
          }`}
        >
          {actionToast.message}
        </div>
      ) : null}
    </div>
    </PermissionGuard>
  );
}
