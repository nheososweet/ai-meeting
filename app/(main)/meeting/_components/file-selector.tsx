"use client";

import { useState, useMemo, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
  Search,
  FileAudio,
  Clock,
  AlertCircle,
  User,
  CheckCircle2,
  Loader2,
  Info,
  Play,
  Calendar,
  Building2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";
import { useFilesInfiniteQuery } from "@/hooks/services/use-files";
import { FileRecord } from "@/lib/types/files";
import { useDebounce } from "@/hooks/use-debounce";

interface FileSelectorProps {
  selectedFileRecord: FileRecord | null;
  onFileSelect: (file: FileRecord) => void;
  onProcessFile: () => void;
  busyProcessing: boolean;
}

/**
 * Component hiển thị thông tin chi tiết và cho phép nghe thử file
 */
function FileDetailsDialog({
  file,
  isOpen,
  onClose,
  onSelect
}: {
  file: FileRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: FileRecord) => void;
}) {
  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <FileAudio className="size-6" />
            </div>
            <div>
              <DialogTitle className="text-lg truncate max-w-[380px]">
                {file.title || file.filename}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono truncate max-w-[380px]">
                {file.filename}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Trình phát nhạc preview */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Play className="size-4 text-primary fill-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nghe thử bản ghi</span>
            </div>
            <audio controls className="w-full h-10 accent-primary" src={file.audioUrl}>
              Trình duyệt của bạn không hỗ trợ nghe thử audio.
            </audio>
          </div>

          {/* Thông tin chi tiết */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Người giao</span>
              <div className="flex items-center gap-2 text-sm">
                <User className="size-3.5 text-primary/70" />
                <span className="font-medium">{file.assignedByUser?.name || "N/A"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Ngày giao</span>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-3.5 text-primary/70" />
                <span className="font-medium">{formatDate(file.createTime)}</span>
              </div>
            </div>
            {file.assignedToGroups.length > 0 && (
              <div className="space-y-1 col-span-2 pt-2 border-t border-border/30">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Phòng ban được gán</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {file.assignedToGroups.map(g => (
                    <Badge key={g.id} variant="secondary" className="text-[10px] font-normal">{g.name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          <Button onClick={() => { onSelect(file); onClose(); }}>
            <CheckCircle2 className="size-4 mr-2" />
            Chọn file này
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FileSelector({
  selectedFileRecord,
  onFileSelect,
  onProcessFile,
  busyProcessing,
}: FileSelectorProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusTab, setStatusTab] = useState<"waiting" | "fail">("waiting");

  // State cho popup chi tiết
  const [detailFile, setDetailFile] = useState<FileRecord | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useFilesInfiniteQuery({
    assigned_filter: true,
    status_step: "transcribe",
    status_value: statusTab,
    search: debouncedSearch || undefined,
    page_size: 20,
  });

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allFiles = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  return (
    <div className="flex flex-col h-[420px] bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm relative">
      {/* Header gọn gàng */}
      <div className="p-3 border-b bg-muted/20 space-y-2">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Tìm theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8.5 h-8 text-[11px] bg-background border-border/40 focus-visible:ring-primary/20 transition-all"
          />
        </div>

        <div className="flex gap-1 p-0.5 bg-muted/60 rounded-md">
          <button
            onClick={() => setStatusTab("waiting")}
            className={cn(
              "flex-1 px-2 py-1 text-[10px] font-bold rounded transition-all uppercase tracking-tight",
              statusTab === "waiting"
                ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Chờ xử lý
          </button>
          <button
            onClick={() => setStatusTab("fail")}
            className={cn(
              "flex-1 px-2 py-1 text-[10px] font-bold rounded transition-all uppercase tracking-tight",
              statusTab === "fail"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Lỗi
          </button>
        </div>
      </div>

      {/* Danh sách List gọn gàng */}
      <div className="flex-1 relative min-h-0 bg-background/50">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1 h-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-primary/60" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-10 text-destructive text-center p-4">
                <AlertCircle className="size-6 mb-2 opacity-50" />
                <p className="text-xs font-medium">Lỗi kết nối máy chủ</p>
                <Button variant="link" size="sm" onClick={() => refetch()} className="text-xs h-auto p-0 underline"> Thử lại </Button>
              </div>
            ) : allFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center p-6">
                <div className="p-3 bg-muted rounded-full mb-3">
                  <FileAudio className="size-6 opacity-30" />
                </div>
                <p className="text-sm font-semibold text-foreground/70">Danh sách trống</p>
                <p className="text-[11px] opacity-60">Chưa có file nào được gán cho bạn trong mục này.</p>
              </div>
            ) : (
              <>
                {allFiles.map((file) => (
                  <div
                    key={file.id}
                    className={cn(
                      "group relative flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none",
                      selectedFileRecord?.id === file.id
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "border-transparent bg-transparent hover:bg-muted/40 hover:border-border/60",
                      busyProcessing && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                    onClick={() => onFileSelect(file)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "size-9 flex items-center justify-center rounded-lg shrink-0 transition-colors",
                        selectedFileRecord?.id === file.id ? "bg-primary text-white" : "bg-muted/80 text-muted-foreground"
                      )}>
                        <FileAudio className="size-4.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className={cn(
                          "text-xs font-semibold truncate",
                          selectedFileRecord?.id === file.id ? "text-primary" : "text-foreground"
                        )}>
                          {file.title || file.filename}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80 mt-0.5">
                          <span className="truncate max-w-[120px]">{formatDate(file.createTime)}</span>
                          <span className="size-1 rounded-full bg-border" />
                          <span className="truncate max-w-[100px]">{file.assignedByUser?.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailFile(file);
                        }}
                      >
                        <Info className="size-3.5" />
                      </Button>
                      {selectedFileRecord?.id === file.id && (
                        <div className="bg-primary text-white rounded-full p-0.5">
                          <CheckCircle2 className="size-3" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div ref={ref} className="h-12 flex items-center justify-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      Đang tải thêm...
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer chứa nút xử lý */}
      <div className="p-3 border-t bg-muted/10 space-y-2">
        {selectedFileRecord && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-primary/5 rounded-lg border border-primary/10 animate-in fade-in slide-in-from-bottom-1">
            <CheckCircle2 className="size-3 text-primary" />
            <p className="text-[10px] font-medium text-primary truncate">
              Đã chọn: {selectedFileRecord.title || selectedFileRecord.filename}
            </p>
          </div>
        )}
        <Button
          onClick={onProcessFile}
          disabled={!selectedFileRecord || busyProcessing}
          className="w-full h-10 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
        >
          {busyProcessing ? (
            <>
              <Loader2 className="mr-2 size-3 animate-spin" />
              Đang xử lý pipeline...
            </>
          ) : (
            <>Bắt đầu phân tích AI</>
          )}
        </Button>
      </div>

      {/* Popup chi tiết */}
      <FileDetailsDialog
        file={detailFile}
        isOpen={!!detailFile}
        onClose={() => setDetailFile(null)}
        onSelect={onFileSelect}
      />
    </div>
  );
}
