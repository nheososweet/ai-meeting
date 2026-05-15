"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { usePaginationState } from "@/hooks/use-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusIcon,
  SearchIcon,
  Loader2Icon,
  AudioLinesIcon,
  DownloadIcon,
  FileTextIcon,
  UserPlusIcon,
  UsersIcon,
  Building2Icon,
  UserIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  UploadCloudIcon,
  FileAudioIcon,
  FileSearchIcon,
  FileCheckIcon,
  MailIcon,
  PlayIcon,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { useFilesQuery } from "@/hooks/services/use-files";
import { UploadFileDialog } from "./_components/upload-dialog";
import { buildDownloadUrl } from "@/app/(main)/history/_lib/file-utils";
import { useHistoryToast } from "@/app/(main)/history/_hooks/useHistoryToast";
import { PermissionGuard } from "@/components/iam/shared/permission-guard";
import { AssignFileDialog } from "./_components/assign-file-dialog";
import { FileRecord } from "@/lib/types/files";

const STEP_OPTIONS = [
  { value: "upload", label: "Tải lên" },
  { value: "transcribe", label: "Chuyển văn bản" },
  { value: "summary", label: "Tóm tắt AI" },
  { value: "report", label: "Biên bản họp" },
  { value: "send_email", label: "Gửi Email" },
];

const SCOPE_OPTIONS = [
  { value: "all", label: "Tất cả tệp" },
  { value: "mine", label: "Tệp của bạn" },
];

const VALUE_OPTIONS = [
  { value: "success", label: "Thành công" },
  { value: "failed", label: "Thất bại" },
  { value: "waiting", label: "Đang chờ" },
];

export default function MeetingRecordsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("assign_files");

  const { actionToast, showActionToast } = useHistoryToast();

  // State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<FileRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<FileRecord | null>(null);

  const [search, setSearch] = useState("");
  const [statusStep, setStatusStep] = useState<string>("upload");
  const [statusValue, setStatusValue] = useState<string>("success");
  const [scope, setScope] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 500);

  const { page, setPage } = usePaginationState([debouncedSearch, statusStep, statusValue, scope]);

  // Hooks
  const { data, isLoading, isFetching, error } = useFilesQuery({
    page,
    page_size: 20,
    search: debouncedSearch || undefined,
    status_step: statusStep,
    status_value: statusValue,
    self_upload: scope === "mine" ? true : undefined,
  });

  const records = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground">Bản ghi cuộc họp</h2>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            Quản lý và theo dõi trạng thái các tệp ghi âm cuộc họp.
          </p>
        </div>

        {/* {canManage && ( */}
        <Button onClick={() => setIsUploadOpen(true)} size="sm" className="shrink-0">
          <PlusIcon className="mr-1.5 size-4" /> Tải lên tệp
        </Button>
        {/* )} */}
      </div>

      {/* Filter Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-border/40 bg-muted/5 p-4">
        <div className="relative w-full sm:w-[280px]">
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
            <SelectTrigger className="h-9 w-[160px] text-xs font-medium bg-muted/20">
              <SelectValue placeholder="Bước xử lý" />
            </SelectTrigger>
            <SelectContent>
              {STEP_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusValue} onValueChange={setStatusValue}>
            <SelectTrigger className="h-9 w-[130px] text-xs font-medium bg-muted/20">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {VALUE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-9 w-[130px] text-xs font-medium bg-muted/20 border-primary/20 text-primary">
              <SelectValue placeholder="Phạm vi" />
            </SelectTrigger>
            <SelectContent>
              {SCOPE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
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
            Đã có lỗi xảy ra khi tải danh sách bản ghi.
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            emptyText={
              search || statusStep !== "transcribe" || statusValue !== "success"
                ? "Không tìm thấy bản ghi nào khớp với bộ lọc."
                : "Chưa có bản ghi nào được tải lên."
            }
          />
        ) : (
          <>
            <div className="flex-1 min-h-0 p-4 [&>div]:h-full [&>div]:overflow-auto [&>div]:rounded-md [&>div]:border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background sticky top-0 z-10 hover:bg-background shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Bản ghi</TableHead>
                    <TableHead className="hidden lg:table-cell">Người tải lên</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider">Tiến độ</TableHead>
                    <TableHead className="hidden lg:table-cell">Người được gán</TableHead>
                    <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => {
                    const isCompleted = record.status === "completed";

                    return (
                      <TableRow key={record.id} className="group transition-colors hover:bg-muted/20">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{record.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <AudioLinesIcon className="size-3.5 text-primary/70" />
                              <span className="font-semibold text-sm text-foreground/90">
                                {record.title || "Chưa có tiêu đề"}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground pl-5 truncate max-w-[300px]">
                              {record.filename}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-[11px] text-muted-foreground font-medium">
                          {record.uploadedBy?.name || "Hệ thống"}
                        </TableCell>
                        <TableCell>
                          <StatusIndicator record={record} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <TooltipProvider>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const totalAssignees =
                                  record.assignedToUsers.length +
                                  record.assignedToGroups.length +
                                  record.assignedToCompanies.length;

                                if (totalAssignees === 0) {
                                  return <span className="text-[10px] italic text-muted-foreground">Chưa phân bổ</span>;
                                }

                                const displayLimit = 3;
                                const allAssignees = [
                                  ...record.assignedToUsers.map(u => ({ id: u.id, name: u.name, type: 'user' })),
                                  ...record.assignedToGroups.map(g => ({ id: g.id, name: g.name, type: 'group' })),
                                  ...record.assignedToCompanies.map(c => ({ id: c.id, name: c.name, type: 'company' }))
                                ];

                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center cursor-help">
                                        <AvatarGroup>
                                          {allAssignees.slice(0, displayLimit).map((assignee) => (
                                            <Avatar key={`${assignee.type}-${assignee.id}`} className="size-6 border-2 border-background">
                                              <AvatarFallback className={cn(
                                                "text-[10px] font-bold uppercase",
                                                assignee.type === 'company' ? "bg-blue-100 text-blue-700" :
                                                  assignee.type === 'group' ? "bg-amber-100 text-amber-700" :
                                                    "bg-primary/10 text-primary"
                                              )}>
                                                {assignee.name.charAt(0)}
                                              </AvatarFallback>
                                            </Avatar>
                                          ))}
                                          {totalAssignees > displayLimit && (
                                            <AvatarGroupCount>+{totalAssignees - displayLimit}</AvatarGroupCount>
                                          )}
                                        </AvatarGroup>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[300px] p-3">
                                      <div className="flex flex-col gap-2">
                                        <p className="text-xs font-semibold border-b pb-1 mb-1">Danh sách phân bổ</p>
                                        <div className="flex flex-col gap-1.5">
                                          {record.assignedToCompanies.length > 0 && (
                                            <div className="flex flex-col gap-1">
                                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Công ty</p>
                                              {record.assignedToCompanies.map(c => (
                                                <div key={c.id} className="flex items-center gap-1.5 text-xs">
                                                  <Building2Icon className="size-3 text-blue-500" />
                                                  <span>{c.name}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {record.assignedToGroups.length > 0 && (
                                            <div className="flex flex-col gap-1">
                                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Phòng ban/Nhóm</p>
                                              {record.assignedToGroups.map(g => (
                                                <div key={g.id} className="flex items-center gap-1.5 text-xs">
                                                  <UsersIcon className="size-3 text-amber-500" />
                                                  <span>{g.name}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {record.assignedToUsers.length > 0 && (
                                            <div className="flex flex-col gap-1">
                                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Cá nhân</p>
                                              {record.assignedToUsers.map(u => (
                                                <div key={u.id} className="flex items-center gap-1.5 text-xs">
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
                                );
                              })()}
                            </div>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-[11px]">
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
                                    onClick={() => {
                                      setPreviewRecord(record);
                                    }}
                                  >
                                    <PlayIcon className="size-3.5 fill-current" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Nghe thử</TooltipContent>
                              </Tooltip>

                              {/* <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                      onClick={() => {
                                        // TODO: Có thể mở xem chi tiết transcript ở đây nếu cần
                                        setPreviewRecord(record);
                                      }}
                                    >
                                      <FileSearchIcon className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Xem chi tiết</TooltipContent>
                                </Tooltip> */}

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    asChild
                                  >
                                    <a href={buildDownloadUrl(record.audioUrl)} download>
                                      <DownloadIcon className="size-3.5" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Tải audio gốc</TooltipContent>
                              </Tooltip>

                              {canManage && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-block">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isCompleted}
                                        className={cn(
                                          "size-8",
                                          isCompleted
                                            ? "text-muted-foreground/40 cursor-not-allowed"
                                            : "text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                                        )}
                                        onClick={() => {
                                          setSelectedRecord(record);
                                          setAssignDialogOpen(true);
                                        }}
                                      >
                                        <UserPlusIcon className="size-3.5" />
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {isCompleted ? "Tệp đã xử lý xong, không thể giao việc" : "Giao hồ sơ"}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
        initialData={selectedRecord ? {
          userId: selectedRecord.assignedToUsers[0]?.id ? String(selectedRecord.assignedToUsers[0].id) : undefined,
          groups: selectedRecord.assignedToGroups.map(g => ({ id: String(g.id), name: g.name })),
          companies: selectedRecord.assignedToCompanies.map(c => ({ id: String(c.id), name: c.name })),
        } : undefined}
        isReadOnly={selectedRecord ? recordStatusIsAllSuccess(selectedRecord) : false}
      />

      <AudioPreviewDialog
        file={previewRecord}
        isOpen={!!previewRecord}
        onClose={() => setPreviewRecord(null)}
      />

    </div>
  );
}

function StatusIndicator({ record }: { record: FileRecord }) {
  const steps = [
    { key: "upload", label: "Tải lên" },
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
                <span className="text-[10px] font-medium">{step.label}: {status === "success" ? "Xong" : status === "processing" ? "Đang xử lý" : "Chờ"}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

function AudioPreviewDialog({
  file,
  isOpen,
  onClose
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
          <DialogTitle className="text-base line-clamp-2 break-all pr-6" title={file.title || file.filename}>
            {file.title || file.filename}
          </DialogTitle>
          <DialogDescription className="text-xs line-clamp-2 break-all" title={file.filename}>
            {file.filename}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <audio controls className="w-full h-10 accent-primary" src={file.audioUrl} autoPlay>
            Trình duyệt của bạn không hỗ trợ audio player.
          </audio>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function recordStatusIsAllSuccess(record: FileRecord) {
  if (!record.fileStatus) return false;
  return Object.values(record.fileStatus).every((s) => s === "success");
}
