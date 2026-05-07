"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusIcon,
  SearchIcon,
  Loader2Icon,
  AudioLinesIcon,
  DownloadIcon,
  FileTextIcon,
} from "lucide-react";
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
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { EmptyState } from "@/components/iam/shared/empty-state";
import { useFilesQuery } from "@/hooks/services/use-files";
import { UploadFileDialog } from "./_components/upload-dialog";
import { buildDownloadUrl } from "@/app/(main)/history/_lib/file-utils";
import { useHistoryToast } from "@/app/(main)/history/_hooks/useHistoryToast";
import { PermissionGuard } from "@/components/iam/shared/permission-guard";

export default function MeetingRecordsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("assign_files");

  const { actionToast, showActionToast } = useHistoryToast();

  // State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 500);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  // Hooks
  const { data, isLoading, error } = useFilesQuery({
    page,
    page_size: 20,
    search: debouncedSearch || undefined,
    status_filter: statusFilter === "all" ? undefined : statusFilter,
  });

  const records = data?.data || [];
  const meta = data?.meta;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "uploaded":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "processing":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "completed":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "failed":
        return "bg-rose-50 text-rose-600 border-rose-200";
      case "pending":
        return "bg-slate-50 text-slate-600 border-slate-200";
      default:
        return "bg-muted/50 text-muted-foreground border-border";
    }
  };

  return (
    <PermissionGuard permission="assign_files">
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground">Bản ghi cuộc họp</h2>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            Quản lý và theo dõi trạng thái các tệp ghi âm cuộc họp.
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setIsUploadOpen(true)} size="sm" className="shrink-0">
            <PlusIcon className="mr-1.5 size-4" /> Tải lên file
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-border/40 bg-muted/5 p-4">
        <div className="relative w-full sm:w-[280px]">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên file hoặc tiêu đề..."
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

        <div className="w-[180px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="uploaded">Uploaded</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
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
              search || statusFilter !== "all"
                ? "Không tìm thấy bản ghi nào khớp với bộ lọc."
                : "Chưa có bản ghi nào được tải lên."
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Bản ghi</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
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
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize",
                            getStatusBadgeClass(record.status)
                          )}
                        >
                          {record.status}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                        {formatDate(record.createTime)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            asChild
                          >
                            <a href={buildDownloadUrl(record.audioUrl)} download={record.filename}>
                              <DownloadIcon className="size-3.5" />
                            </a>
                          </Button>
                          {record.report && (
                             <Button
                             variant="ghost"
                             size="icon"
                             className="size-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                             title="Xem báo cáo"
                           >
                             <FileTextIcon className="size-3.5" />
                           </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {meta && meta.total_pages > 1 && (
              <div className="flex items-center justify-between py-2">
                <div className="text-xs text-muted-foreground">
                  Hiển thị{" "}
                  <span className="font-medium text-foreground">
                    {(meta.page - 1) * meta.page_size + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-medium text-foreground">
                    {Math.min(meta.page * meta.page_size, meta.total_items)}
                  </span>{" "}
                  trong <span className="font-medium text-foreground">{meta.total_items}</span> bản
                  ghi
                </div>

                <Pagination className="w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={(e) => {
                          e.preventDefault();
                          if (meta.has_prev) setPage((p) => p - 1);
                        }}
                        className={cn(
                          "cursor-pointer",
                          !meta.has_prev && "pointer-events-none opacity-50"
                        )}
                        text="Trước"
                      />
                    </PaginationItem>

                    {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map((p) => {
                      if (
                        p === 1 ||
                        p === meta.total_pages ||
                        (p >= meta.page - 1 && p <= meta.page + 1)
                      ) {
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink
                              isActive={p === meta.page}
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(p);
                              }}
                              className="cursor-pointer"
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      if (p === meta.page - 2 || p === meta.page + 2) {
                        return (
                          <PaginationItem key={p}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={(e) => {
                          e.preventDefault();
                          if (meta.has_next) setPage((p) => p + 1);
                        }}
                        className={cn(
                          "cursor-pointer",
                          !meta.has_next && "pointer-events-none opacity-50"
                        )}
                        text="Sau"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </div>

      <UploadFileDialog 
        open={isUploadOpen} 
        onOpenChange={setIsUploadOpen} 
        showActionToast={showActionToast}
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
