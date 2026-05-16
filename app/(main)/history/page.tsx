"use client";

import { useMemo, useState } from "react";
import { usePaginationState } from "@/hooks/use-pagination";
import {
  Loader2Icon,
  AudioLinesIcon,
  FileTextIcon,
  FileCheckIcon,
  MailIcon,
  PlayIcon,
  SearchIcon,
  ClockIcon,
  CheckCircle2Icon,
  UserIcon,
  FilterIcon,
  DownloadIcon,
  AudioLinesIcon as AudioIcon,
  ChevronDownIcon
} from "lucide-react";

import { ReportPreviewDialog } from "@/app/(main)/history/_components/ReportPreviewDialog";
import { SendEmailDialog } from "@/app/(main)/history/_components/SendEmailDialog";
import { TranscriptPreviewDialog } from "@/app/(main)/history/_components/TranscriptPreviewDialog";
import { HistorySpeakersLabelingDialog } from "@/app/(main)/history/_components/HistorySpeakersLabelingDialog";
import { TranscriptEditorDialog } from "@/app/(main)/meeting/_components/TranscriptEditorDialog";
import { useUpdateTranscribeMutation } from "@/hooks/services/use-update-transcribe-mutation";
import {
  resolveReportFilename,
} from "@/app/(main)/history/_lib/file-utils";
import { reformatTranscriptTimestamps } from "@/app/(main)/workspace/_lib/transcript-utils";
import { useHistoryEmail } from "@/app/(main)/history/_hooks/useHistoryEmail";
import { useHistoryToast } from "@/app/(main)/history/_hooks/useHistoryToast";
import { useHistoryTranscriptPreview } from "@/app/(main)/history/_hooks/useHistoryTranscriptPreview";
import { useFilesQuery } from "@/hooks/services/use-files";
import { FileRecord } from "@/lib/types/files";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDate } from "@/lib/utils";
import { PermissionGuard } from "@/components/iam/shared/permission-guard";
import { EmptyState } from "@/components/iam/shared/empty-state";
import { useDebounce } from "@/hooks/use-debounce";

const STEP_OPTIONS = [
  { value: "transcribe", label: "Chuyển văn bản" },
  { value: "summary", label: "Tóm tắt AI" },
  { value: "report", label: "Biên bản họp" },
  { value: "send_email", label: "Gửi Email" },
];

const VALUE_OPTIONS = [
  { value: "success", label: "Thành công" },
  { value: "failed", label: "Thất bại" },
  { value: "waiting", label: "Đang chờ" },
];

export default function HistoryPage() {
  const { hasPermission } = useAuth();
  const canSendMail = hasPermission("send_mail");

  const [previewAudioRecord, setPreviewAudioRecord] = useState<FileRecord | null>(null);
  const [previewReportRecordId, setPreviewReportRecordId] = useState<number | null>(null);
  const [isLabelingDialogOpen, setIsLabelingDialogOpen] = useState(false);
  const [isTranscriptEditorOpen, setIsTranscriptEditorOpen] = useState(false);
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);
  const [transcriptEditorError, setTranscriptEditorError] = useState<string | null>(null);

  const updateTranscribeMutation = useUpdateTranscribeMutation();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  // Granular Filters
  const [statusStep, setStatusStep] = useState<string>("transcribe");
  const [statusValue, setStatusValue] = useState<string>("success");

  const { page, setPage, pageSize } = usePaginationState([debouncedSearch, statusStep, statusValue], 20);

  // Connect to the Files API with granular filters
  const { data, isLoading, isFetching, isError } = useFilesQuery({
    page,
    page_size: pageSize,
    status_step: statusStep,
    status_value: statusValue,
    search: debouncedSearch || undefined,
  });

  const records = data?.data || [];
  const meta = data?.meta;

  const adaptedRecords = useMemo(() => {
    return records.map(r => ({
      ...r,
      reportUrl: r.report
    }));
  }, [records]);

  const { showActionToast } = useHistoryToast();

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
    records: adaptedRecords as any,
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
    records: adaptedRecords as any,
    showActionToast,
    canSendMail,
  });

  const activeReportRecord = useMemo(() => {
    if (!previewReportRecordId) return null;
    return adaptedRecords.find((record) => record.id === previewReportRecordId) ?? null;
  }, [previewReportRecordId, adaptedRecords]);

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

  function handleLabelingSuccess(newRawTranscript: string) {
    if (previewTranscriptRecordId) {
      setPreviewTranscriptByRecord((prev) => ({
        ...prev,
        [previewTranscriptRecordId]: newRawTranscript,
      }));
    }
  }

  async function handleSaveEditedTranscript(content: string) {
    if (!previewTranscriptRecordId) return;

    setTranscriptEditorError(null);
    setIsSavingTranscript(true);

    try {
      await updateTranscribeMutation.mutateAsync({
        id: previewTranscriptRecordId,
        textContent: content,
      });

      setPreviewTranscriptByRecord((prev) => ({
        ...prev,
        [previewTranscriptRecordId]: content,
      }));

      setIsTranscriptEditorOpen(false);
      showActionToast("Đã lưu bản gỡ băng thành công.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lỗi không xác định";
      setTranscriptEditorError(`Lỗi khi lưu bản gỡ băng: ${message}`);
    } finally {
      setIsSavingTranscript(false);
    }
  }

  return (
    <PermissionGuard permission="view_records">
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground">Lịch sử họp</h2>
            <p className="text-sm font-medium text-muted-foreground mt-0.5 truncate">
              Quản lý và xem lại các biên bản cuộc họp.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-border/40 bg-muted/5 p-4">
          <div className="relative w-full sm:w-[280px]">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm cuộc họp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 pr-8 text-xs bg-muted/10 border-border/60"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={statusStep} onValueChange={(val) => { setStatusStep(val); }}>
              <SelectTrigger className="h-9 flex-1 sm:w-[160px] text-xs font-medium bg-muted/20">
                <SelectValue placeholder="Bước xử lý" />
              </SelectTrigger>
              <SelectContent>
                {STEP_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusValue} onValueChange={(val) => { setStatusValue(val); }}>
              <SelectTrigger className="h-9 flex-1 sm:w-[130px] text-xs font-medium bg-muted/20">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {VALUE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-muted/5">
          {isLoading ? (
            <div className="flex h-60 items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2Icon className="size-8 animate-spin text-primary/60" />
                <p className="text-xs text-muted-foreground font-medium">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : isError ? (
            <div className="flex h-40 items-center justify-center text-destructive text-sm font-medium">
              Đã có lỗi xảy ra khi tải danh sách lịch sử.
            </div>
          ) : records.length === 0 ? (
            <EmptyState
              emptyText={search ? "Không tìm thấy kết quả phù hợp." : "Chưa có lịch sử cuộc họp."}
            />
          ) : (
            <>
              <div className="flex-1 min-h-0 p-4 [&>div]:h-full [&>div]:overflow-auto [&>div]:rounded-md [&>div]:border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-background sticky top-0">
                      <TableHead className="w-[70px] pl-5">STT</TableHead>
                      <TableHead>Cuộc họp</TableHead>
                      <TableHead className="hidden lg:table-cell">Người xử lý</TableHead>
                      <TableHead>Tiến độ</TableHead>
                      <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                      <TableHead className="text-right pr-5">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record, index) => (
                      <TableRow key={record.id} className="group transition-colors hover:bg-muted/20">
                        <TableCell className="text-xs text-muted-foreground pl-5">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <AudioLinesIcon className="size-3.5 text-primary/70" />
                              <span className="font-semibold text-sm text-foreground/90">
                                {record.title || "Chưa có tiêu đề"}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-muted-foreground pl-5 truncate max-w-70">
                              {record.filename}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2.5">
                            {record.assignedToUsers.length > 0 ? (
                              <>
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-foreground/80">{record.assignedToUsers[0].name}</span>
                                  <span className="text-xs font-medium text-muted-foreground italic">Người xử lý</span>
                                </div>
                              </>
                            ) : (
                              <span className="text-xs font-medium text-muted-foreground italic">Chưa gán</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusIndicator record={record} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm font-medium">
                          {formatDate(record.createTime)}
                        </TableCell>
                        <TableCell className="text-right pr-5">
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>

                              {record.report && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-emerald-600 hover:bg-emerald-50"
                                      onClick={() => {
                                        setPreviewReportRecordId(record.id);
                                      }}
                                    >
                                      <FileCheckIcon className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Xem Biên bản</TooltipContent>
                                </Tooltip>
                              )}

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    onClick={() => handlePreviewTranscript(record as any)}
                                  >
                                    <FileTextIcon className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Xem bản gỡ băng</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    onClick={() => setPreviewAudioRecord(record)}
                                  >
                                    <PlayIcon className="size-3.5 fill-current" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Nghe lại</TooltipContent>
                              </Tooltip>

                              {canSendMail && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                                      onClick={() => handleOpenSendEmailDialog(record.id)}
                                    >
                                      <MailIcon className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Gửi Email</TooltipContent>
                                </Tooltip>
                              )}

                              <DropdownMenu>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                        >
                                          <DownloadIcon className="size-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Tải xuống</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Tùy chọn tải xuống</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild disabled={!record.transcribeUrl}>
                                    <a href={record.transcribeUrl || "#"} download className="flex items-center gap-2 cursor-pointer">
                                      <FileTextIcon className="size-3.5 text-blue-500" />
                                      <span className="text-xs">Tải bản gỡ băng (.txt)</span>
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild disabled={!record.audioUrl}>
                                    <a href={record.audioUrl || "#"} download className="flex items-center gap-2 cursor-pointer">
                                      <AudioIcon className="size-3.5 text-emerald-500" />
                                      <span className="text-xs">Tải tệp âm thanh</span>
                                    </a>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DataTablePagination
                meta={meta!}
                onPageChange={setPage}
                itemLabel="bản ghi"
                isFetching={isFetching}
                className="shrink-0 px-4 pb-4"
              />
            </>
          )}
        </div>
      </div>

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
        onOpenEdit={() => setIsTranscriptEditorOpen(true)}
        audioUrl={activeTranscriptRecord?.audioUrl}
      />

      <TranscriptEditorDialog
        open={isTranscriptEditorOpen}
        onOpenChange={setIsTranscriptEditorOpen}
        rawTranscript={activeTranscriptContent}
        isSaving={isSavingTranscript}
        onSave={handleSaveEditedTranscript}
        error={transcriptEditorError}
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
        onOpenChange={(nextOpen) => !nextOpen && setPreviewReportRecordId(null)}
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

      <AudioPreviewDialog
        file={previewAudioRecord}
        isOpen={!!previewAudioRecord}
        onClose={() => setPreviewAudioRecord(null)}
      />

    </PermissionGuard>
  );
}

function StatusIndicator({ record }: { record: FileRecord }) {
  const steps = [
    { key: "transcribe", label: "Bản gỡ băng" },
    { key: "summary", label: "Tóm tắt" },
    { key: "report", label: "Biên bản" },
    { key: "sendEmail", label: "Email" },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step) => {
        const status = record.fileStatus[step.key as keyof typeof record.fileStatus];
        return (
          <TooltipProvider key={step.key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  {status === "success" ? (
                    <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                  ) : status === "processing" ? (
                    <Loader2Icon className="size-3.5 text-blue-500 animate-spin" />
                  ) : (
                    <ClockIcon className="size-3.5 text-slate-300" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <span className="text-xs font-medium">{step.label}: {status === "success" ? "Xong" : status === "processing" ? "Đang xử lý" : "Chờ"}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

function AudioPreviewDialog({ file, isOpen, onClose }: { file: FileRecord | null; isOpen: boolean; onClose: () => void; }) {
  if (!file) return null;
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] overflow-hidden gap-0 p-0 border-none shadow-2xl rounded-2xl bg-gradient-to-b from-background to-muted/20">
        <div className="relative p-6 space-y-6 min-w-0">
          <div className="space-y-1.5 pr-8 min-w-0">
            <h3 className="text-lg font-bold text-foreground leading-tight line-clamp-2 break-all" title={file.title || file.filename}>
              {file.title || file.filename}
            </h3>
            <p className="text-xs font-medium text-muted-foreground/80 flex items-center gap-1.5 min-w-0">
              <span className="size-1.5 rounded-full bg-primary/40 shrink-0" />
              <span className="truncate min-w-0" title={file.filename}>{file.filename}</span>
            </p>
          </div>

          {/* <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <ChevronDownIcon className="size-5 rotate-90" />
          </button> */}

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-card border border-border/50 rounded-xl p-4 shadow-sm">
              <audio controls className="w-full h-12 accent-primary custom-audio-player" src={file.audioUrl} autoPlay>
                Trình duyệt của bạn không hỗ trợ audio player.
              </audio>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center">
                <PlayIcon className="size-3 text-blue-600 fill-current" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Đang nghe thử</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs font-bold hover:bg-rose-50 hover:text-rose-600 rounded-full h-8">
              Kết thúc
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
