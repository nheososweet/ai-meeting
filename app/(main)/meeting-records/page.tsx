"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { usePaginationState } from "@/hooks/use-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  PlusIcon,
  SearchIcon,
  Loader2Icon,
  AudioLinesIcon,
  DownloadIcon,
  UserPlusIcon,
  UsersIcon,
  Building2Icon,
  UserIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  PlayIcon,
  ActivityIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { EmptyState } from "@/components/iam/shared/empty-state";
import {
  useMyHistoryQuery,
  useMyUploadsQuery,
} from "@/hooks/services/use-files";
import { UploadFileDialog } from "./_components/upload-dialog";
import { buildDownloadUrl, resolveReportFilename } from "@/app/(main)/history/_lib/file-utils";
import { useHistoryToast } from "@/app/(main)/history/_hooks/useHistoryToast";
import { useHistoryTranscriptPreview } from "@/app/(main)/history/_hooks/useHistoryTranscriptPreview";
import { useHistoryEmail } from "@/app/(main)/history/_hooks/useHistoryEmail";
import { TranscriptPreviewDialog } from "@/app/(main)/history/_components/TranscriptPreviewDialog";
import { ReportPreviewDialog } from "@/app/(main)/history/_components/ReportPreviewDialog";
import { SendEmailDialog } from "@/app/(main)/history/_components/SendEmailDialog";
import { reformatTranscriptTimestamps } from "@/app/(main)/workspace/_lib/transcript-utils";
import { AssignFileDialog } from "./_components/assign-file-dialog";
import { FileHistoryDialog } from "./_components/file-history-dialog";
import { type FileRecord, type MyHistoryRecord } from "@/lib/types/files";

// ── Constants ──────────────────────────────────────────────────

const ASSIGNED_STEP_OPTIONS = [
  { value: "transcribe", label: "Chuyển văn bản" },
  { value: "summary", label: "Tóm tắt AI" },
  { value: "report", label: "Biên bản họp" },
  { value: "send_email", label: "Gửi Email" },
];

const UPLOADS_STEP_OPTIONS = [
  { value: "upload", label: "Tải lên" },
  { value: "transcribe", label: "Chuyển văn bản" },
  { value: "summary", label: "Tóm tắt AI" },
  { value: "report", label: "Biên bản họp" },
  { value: "send_email", label: "Gửi Email" },
];

const VALUE_OPTIONS = [
  { value: "success", label: "Thành công" },
  { value: "fail", label: "Thất bại" },
  { value: "waiting", label: "Đang chờ" },
];

// ── Main Page ──────────────────────────────────────────────────

export default function MeetingRecordsPage() {
  const [activeTab, setActiveTab] = useState("assigned");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { showActionToast } = useHistoryToast();

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground">
            Bản ghi cuộc họp
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            Quản lý và theo dõi trạng thái các tệp ghi âm cuộc họp.
          </p>
        </div>
        {activeTab === "uploads" && (
          <Button
            onClick={() => setIsUploadOpen(true)}
            size="sm"
            className="shrink-0"
          >
            <PlusIcon className="mr-1.5 size-4" /> Tải lên tệp
          </Button>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="shrink-0 border-b border-border/60 px-5 py-3">
          <TabsList className="h-9 bg-transparent p-0 gap-1 w-max">
            <TabsTrigger
              value="assigned"
              className="h-8 rounded-md px-3 text-sm font-medium transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Được giao
            </TabsTrigger>
            <TabsTrigger
              value="uploads"
              className="h-8 rounded-md px-3 text-sm font-medium transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Tệp tải lên
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="assigned"
          className="flex-1 overflow-hidden m-0 flex flex-col"
        >
          <AssignedTab />
        </TabsContent>

        <TabsContent
          value="uploads"
          className="flex-1 overflow-hidden m-0 flex flex-col"
        >
          <UploadsTab
            isUploadOpen={isUploadOpen}
            setIsUploadOpen={setIsUploadOpen}
            showActionToast={showActionToast}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Tab 1: Được giao (/files/my-history) ──────────────────────

function AssignedTab() {
  const [search, setSearch] = useState("");
  const [statusStep, setStatusStep] = useState<string>("");
  const [statusValue, setStatusValue] = useState<string>("");
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MyHistoryRecord | null>(
    null,
  );

  const debouncedSearch = useDebounce(search, 500);
  const { page, setPage } = usePaginationState([
    debouncedSearch,
    statusStep,
    statusValue,
  ]);

  const { data, isLoading, isFetching, error } = useMyHistoryQuery({
    page,
    page_size: 20,
    search: debouncedSearch || undefined,
    status_step: statusStep || undefined,
    status_value: statusValue || undefined,
    is_history: false,
  });

  const records = data?.data || [];
  const meta = data?.meta;

  return (
    <>
      <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-border/40 bg-muted/5 p-4">
        <div className="relative w-full sm:w-70">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên tệp hoặc tiêu đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 pr-8"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusStep} onValueChange={setStatusStep}>
            <SelectTrigger className="h-9 w-40 text-xs font-medium bg-muted/20">
              <SelectValue placeholder="Bước xử lý" />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNED_STEP_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusValue} onValueChange={setStatusValue}>
            <SelectTrigger className="h-9 w-32 text-xs font-medium bg-muted/20">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {VALUE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(statusStep || statusValue) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setStatusStep("");
                setStatusValue("");
              }}
            >
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-40 items-center justify-center text-destructive text-sm font-medium">
            Đã có lỗi xảy ra khi tải danh sách.
          </div>
        ) : records.length === 0 ? (
          <EmptyState emptyText="Không có bản ghi nào được giao cho bạn." />
        ) : (
          <>
            <div className="flex-1 min-h-0 p-4 [&>div]:h-full [&>div]:overflow-auto [&>div]:rounded-md [&>div]:border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background sticky top-0 z-10 hover:bg-background shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                    <TableHead className="w-20">STT</TableHead>
                    <TableHead>Bản ghi</TableHead>
                    <TableHead>Tiến độ</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Ngày tạo
                    </TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record, index) => (
                    <TableRow
                      key={record.historyId ?? `file-${record.fileId}`}
                      className="group transition-colors hover:bg-muted/20"
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {(page - 1) * 20 + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <AudioLinesIcon className="size-3.5 text-primary/70" />
                            <span className="font-semibold text-sm text-foreground/90">
                              {record.title || "Chưa có tiêu đề"}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground pl-5 truncate max-w-75">
                            {record.filename}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <AssignedStatusIndicator record={record} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs font-medium">
                        {formatDate(record.createTime)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            {/* <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setHistoryDialogOpen(true);
                                  }}
                                >
                                  <ActivityIcon className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Xem tiến độ</TooltipContent>
                            </Tooltip> */}

                            {record.transcribeUrl && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    asChild
                                  >
                                    <a href={record.transcribeUrl} download>
                                      <DownloadIcon className="size-3.5" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Tải bản gỡ băng</TooltipContent>
                              </Tooltip>
                            )}
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

      <FileHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        fileId={selectedRecord?.fileId || null}
        filename={selectedRecord?.filename}
      />
    </>
  );
}

// ── Tab 2: File tải lên (/files/my-uploads) ───────────────────

function UploadsTab({
  isUploadOpen,
  setIsUploadOpen,
  showActionToast,
}: {
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  showActionToast: ReturnType<typeof useHistoryToast>["showActionToast"];
}) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("assign_files");
  const canSendMail = hasPermission("send_mail");

  const [search, setSearch] = useState("");
  const [statusStep, setStatusStep] = useState<string>("upload");
  const [statusValue, setStatusValue] = useState<string>("success");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<FileRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<FileRecord | null>(null);
  const [historyPreviewReport, setHistoryPreviewReport] = useState<{
    url: string;
    filename: string;
  } | null>(null);

  const debouncedSearch = useDebounce(search, 500);
  const { page, setPage } = usePaginationState([
    debouncedSearch,
    statusStep,
    statusValue,
  ]);

  const { data, isLoading, isFetching, error } = useMyUploadsQuery({
    page,
    page_size: 20,
    search: debouncedSearch || undefined,
    status_step: statusStep || undefined,
    status_value: statusValue || undefined,
  });

  const records = data?.data || [];
  const meta = data?.meta;

  const adaptedRecords = useMemo(
    () => records.map((r) => ({ ...r, reportUrl: r.report })),
    [records],
  );

  const {
    previewTranscriptByRecord,
    loadingTranscriptRecordId,
    previewTranscriptRecordId,
    activeTranscriptRecord,
    handlePreviewTranscript,
    handleCopyTranscriptPreview,
    closeTranscriptPreview,
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

  const activeTranscriptContent = useMemo(() => {
    const raw = previewTranscriptRecordId
      ? (previewTranscriptByRecord[previewTranscriptRecordId] ?? "")
      : "";
    return reformatTranscriptTimestamps(raw);
  }, [previewTranscriptRecordId, previewTranscriptByRecord]);

  return (
    <>
      <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-border/40 bg-muted/5 p-4">
        <div className="relative w-full sm:w-70">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên tệp hoặc tiêu đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 pr-8"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusStep} onValueChange={setStatusStep}>
            <SelectTrigger className="h-9 w-40 text-xs font-medium bg-muted/20">
              <SelectValue placeholder="Bước xử lý" />
            </SelectTrigger>
            <SelectContent>
              {UPLOADS_STEP_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusValue} onValueChange={setStatusValue}>
            <SelectTrigger className="h-9 w-32 text-xs font-medium bg-muted/20">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {VALUE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-40 items-center justify-center text-destructive text-sm font-medium">
            Đã có lỗi xảy ra khi tải danh sách tệp.
          </div>
        ) : records.length === 0 ? (
          <EmptyState emptyText="Chưa có tệp nào được tải lên." />
        ) : (
          <>
            <div className="flex-1 min-h-0 p-4 [&>div]:h-full [&>div]:overflow-auto [&>div]:rounded-md [&>div]:border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background sticky top-0 z-10 hover:bg-background shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                    <TableHead className="w-20">STT</TableHead>
                    <TableHead>Bản ghi</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Người tải lên
                    </TableHead>
                    <TableHead>Tiến độ</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Người được gán
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Ngày tạo
                    </TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record, index) => (
                    <TableRow
                      key={record.id}
                      className="group transition-colors hover:bg-muted/20"
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {(page - 1) * 20 + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <AudioLinesIcon className="size-3.5 text-primary/70" />
                            <span className="font-semibold text-sm text-foreground/90">
                              {record.title || "Chưa có tiêu đề"}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground pl-5 truncate max-w-75">
                            {record.filename}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-medium">
                        {record.uploadedBy?.name || "Hệ thống"}
                      </TableCell>
                      <TableCell>
                        <UploadsStatusIndicator record={record} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <AssigneesCell record={record} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs font-medium">
                        {formatDate(record.createTime)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  onClick={() => setPreviewRecord(record)}
                                >
                                  <PlayIcon className="size-3.5 fill-current" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Nghe thử</TooltipContent>
                            </Tooltip>

                            {record.isSelfUpload && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    asChild
                                  >
                                    <a
                                      href={buildDownloadUrl(record.audioUrl)}
                                      download
                                    >
                                      <DownloadIcon className="size-3.5" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Tải audio gốc</TooltipContent>
                              </Tooltip>
                            )}

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setHistoryDialogOpen(true);
                                  }}
                                >
                                  <ActivityIcon className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Xem tiến độ</TooltipContent>
                            </Tooltip>

                            {canManage && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                                      onClick={() => {
                                        setSelectedRecord(record);
                                        setAssignDialogOpen(true);
                                      }}
                                    >
                                      <UserPlusIcon className="size-3.5" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Giao hồ sơ</TooltipContent>
                              </Tooltip>
                            )}
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
              itemLabel="tệp"
              isFetching={isFetching}
              className="shrink-0 px-4 pb-4"
            />
          </>
        )}
      </div>

      <UploadFileDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        showActionToast={showActionToast}
      />

      <AssignFileDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        fileId={selectedRecord?.id || null}
        filename={selectedRecord?.filename || ""}
        initialData={
          selectedRecord
            ? {
              users: selectedRecord.assignedToUsers.map((u) => ({
                id: String(u.id),
                name: u.name,
              })),
              groups: selectedRecord.assignedToGroups.map((g) => ({
                id: String(g.id),
                name: g.name,
              })),
              companies: selectedRecord.assignedToCompanies.map((c) => ({
                id: String(c.id),
                name: c.name,
              })),
            }
            : undefined
        }
        isReadOnly={
          selectedRecord ? recordStatusIsAllSuccess(selectedRecord) : false
        }
      />

      <FileHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        fileId={selectedRecord?.id || null}
        filename={selectedRecord?.filename}
        canSendMail={canSendMail}
        onPreviewReport={(url, filename) =>
          setHistoryPreviewReport({ url, filename })
        }
        onPreviewTranscript={(transcribeUrl, userId) =>
          handlePreviewTranscript({
            id: (selectedRecord?.id ?? 0) * 10000 + userId,
            transcribeUrl,
            filename: selectedRecord?.filename ?? "",
            audioUrl: selectedRecord?.audioUrl ?? null,
          } as any)
        }
        onSendEmail={() => handleOpenSendEmailDialog(selectedRecord!.id)}
      />

      <AudioPreviewDialog
        file={previewRecord}
        isOpen={!!previewRecord}
        onClose={() => setPreviewRecord(null)}
      />

      <TranscriptPreviewDialog
        open={previewTranscriptRecordId !== null}
        transcriptRecordId={previewTranscriptRecordId}
        transcriptRecordFilename={
          activeTranscriptRecord?.filename ?? selectedRecord?.filename
        }
        transcriptContent={activeTranscriptContent}
        isLoading={
          previewTranscriptRecordId !== null &&
          loadingTranscriptRecordId === previewTranscriptRecordId
        }
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeTranscriptPreview();
        }}
        onCopyTranscript={handleCopyTranscriptPreview}
        audioUrl={
          activeTranscriptRecord?.audioUrl ?? selectedRecord?.audioUrl
        }
      />

      <ReportPreviewDialog
        open={historyPreviewReport !== null}
        reportRecordId={null}
        reportRecordFilename={historyPreviewReport?.filename}
        reportUrl={historyPreviewReport?.url}
        reportFileName={historyPreviewReport?.filename ?? ""}
        onOpenChange={(nextOpen) => !nextOpen && setHistoryPreviewReport(null)}
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
    </>
  );
}

// ── Assignees Cell ─────────────────────────────────────────────

function AssigneesCell({ record }: { record: FileRecord }) {
  const totalAssignees =
    record.assignedToUsers.length +
    record.assignedToGroups.length +
    record.assignedToCompanies.length;

  if (totalAssignees === 0) {
    return (
      <span className="text-xs font-medium italic text-muted-foreground">
        Chưa phân bổ
      </span>
    );
  }

  const displayLimit = 3;
  const allAssignees = [
    ...record.assignedToUsers.map((u) => ({
      id: u.id,
      name: u.name,
      type: "user",
    })),
    ...record.assignedToGroups.map((g) => ({
      id: g.id,
      name: g.name,
      type: "group",
    })),
    ...record.assignedToCompanies.map((c) => ({
      id: c.id,
      name: c.name,
      type: "company",
    })),
  ];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center cursor-help">
            <div className="flex -space-x-2">
              {allAssignees.slice(0, displayLimit).map((assignee) => (
                <Avatar
                  key={`${assignee.type}-${assignee.id}`}
                  className={cn(
                    "size-7 ring-2 ring-background",
                    assignee.type === "company"
                      ? "bg-blue-100"
                      : assignee.type === "group"
                        ? "bg-amber-100"
                        : "bg-primary/10",
                  )}
                >
                  <AvatarFallback
                    className={cn(
                      "text-[11px] font-bold uppercase",
                      assignee.type === "company"
                        ? "text-blue-700"
                        : assignee.type === "group"
                          ? "text-amber-700"
                          : "text-primary",
                    )}
                  >
                    {assignee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {totalAssignees > displayLimit && (
                <Avatar className="size-7 ring-2 ring-background">
                  <AvatarFallback className="text-[11px] font-medium text-muted-foreground">
                    +{totalAssignees - displayLimit}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-75 p-3">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold border-b pb-1 mb-1">
              Danh sách phân bổ
            </p>
            <div className="flex flex-col gap-1.5">
              {record.assignedToCompanies.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Công ty
                  </p>
                  {record.assignedToCompanies.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <Building2Icon className="size-3 text-blue-500" />
                      <span>{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {record.assignedToGroups.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Phòng ban/Nhóm
                  </p>
                  {record.assignedToGroups.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <UsersIcon className="size-3 text-amber-500" />
                      <span>{g.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {record.assignedToUsers.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Cá nhân
                  </p>
                  {record.assignedToUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <UserIcon className="size-3 text-primary" />
                      <span>{u.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Status Indicators ──────────────────────────────────────────

const ASSIGNED_STEPS = [
  { key: "transcribe", label: "Bản gỡ băng" },
  { key: "summary", label: "Tóm tắt" },
  { key: "report", label: "Biên bản" },
  { key: "sendEmail", label: "Email" },
] as const;

const UPLOADS_STEPS = [
  { key: "upload", label: "Tải lên" },
  { key: "transcribe", label: "Bản gỡ băng" },
  { key: "summary", label: "Tóm tắt" },
  { key: "report", label: "Biên bản" },
  { key: "sendEmail", label: "Email" },
] as const;

function StepIcon({ status, label }: { status: string; label: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            {status === "success" ? (
              <CheckCircle2Icon className="size-3.5 text-emerald-500" />
            ) : status === "fail" ? (
              <AlertCircleIcon className="size-3.5 text-red-400" />
            ) : status === "processing" ? (
              <Loader2Icon className="size-3.5 text-blue-500 animate-spin" />
            ) : (
              <ClockIcon className="size-3.5 text-slate-300" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span className="text-xs font-medium">
            {label}:{" "}
            {status === "success"
              ? "Xong"
              : status === "fail"
                ? "Lỗi"
                : status === "processing"
                  ? "Đang xử lý"
                  : "Chờ"}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AssignedStatusIndicator({ record }: { record: MyHistoryRecord }) {
  return (
    <div className="flex items-center gap-1.5">
      {ASSIGNED_STEPS.map((step) => (
        <StepIcon
          key={step.key}
          status={record.stepStatus[step.key as keyof typeof record.stepStatus]}
          label={step.label}
        />
      ))}
    </div>
  );
}

function UploadsStatusIndicator({ record }: { record: FileRecord }) {
  return (
    <div className="flex items-center gap-1.5">
      {UPLOADS_STEPS.map((step) => (
        <StepIcon
          key={step.key}
          status={record.fileStatus[step.key as keyof typeof record.fileStatus]}
          label={step.label}
        />
      ))}
    </div>
  );
}

// ── Audio Preview Dialog ───────────────────────────────────────

function AudioPreviewDialog({
  file,
  isOpen,
  onClose,
}: {
  file: FileRecord | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle
            className="text-base line-clamp-2 break-all pr-6"
            title={file.title || file.filename}
          >
            {file.title || file.filename}
          </DialogTitle>
          <DialogDescription
            className="text-xs line-clamp-2 break-all"
            title={file.filename}
          >
            {file.filename}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <audio
            controls
            className="w-full h-10 accent-primary"
            src={file.audioUrl}
            autoPlay
            {...(!file.isSelfUpload && { controlsList: "nodownload" })}
          >
            Trình duyệt của bạn không hỗ trợ audio player.
          </audio>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ────────────────────────────────────────────────────

function recordStatusIsAllSuccess(record: FileRecord) {
  if (!record.fileStatus) return false;
  return Object.values(record.fileStatus).every((s) => s === "success");
}
