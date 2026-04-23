import {
  ChevronLeftIcon,
  CopyIcon,
  Maximize2Icon,
  PencilIcon,
  LoaderCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type TranscriptComparisonDialogProps = {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  onOpenEditor: () => void;
  rawTranscript: string;
  refinedTranscript?: string;
  transcriptDraft: string;
  onTranscriptDraftChange: (value: string) => void;
  shouldShowRefinedTranscript: boolean;
  isSavingTranscript: boolean;
  onSaveTranscriptDraft: () => void;
  onCopyRawTranscript: () => void;
  onCopyRefinedTranscript: () => void;
};

export function TranscriptComparisonDialog({
  open,
  onOpenChange,
  onOpenEditor,
  rawTranscript,
  refinedTranscript,
  transcriptDraft,
  onTranscriptDraftChange,
  shouldShowRefinedTranscript,
  isSavingTranscript,
  onSaveTranscriptDraft,
  onCopyRawTranscript,
  onCopyRefinedTranscript,
}: TranscriptComparisonDialogProps) {
  return (
    <div className="mt-4 rounded-lg border border-border/70 bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Transcript</h3>
          <p className="text-xs text-muted-foreground">
            Xem bản gốc và bản làm sạch, có thể chỉnh sửa trực tiếp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={onOpenEditor}
              >
                <PencilIcon className="size-3.5" />
                Sửa transcript
              </Button>
            </DialogTrigger>

            <DialogContent
              showCloseButton={false}
              className="mb-4 flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col justify-between gap-0 overflow-hidden rounded-xl p-0 sm:max-w-none"
            >
              <DialogHeader className="space-y-0 text-left">
                <DialogTitle className="px-6 pt-6 text-base">
                  Chỉnh sửa Transcript
                </DialogTitle>
                <DialogDescription className="px-6 pb-3 text-xs">
                  Sửa nội dung văn bản trực tiếp. Sau khi lưu, hệ thống sẽ tính
                  toán lại điểm chất lượng.
                </DialogDescription>
              </DialogHeader>

              <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6 lg:flex-row">
                {/* View Raw (ReadOnly) */}
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Bản gốc từ nhận diện
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={onCopyRawTranscript}
                      title="Copy bản gốc"
                    >
                      <CopyIcon className="size-3.5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/10 p-4 text-sm leading-7 text-muted-foreground opacity-70">
                    {rawTranscript}
                  </div>
                </div>

                {/* Edit Refined */}
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="transcript-draft"
                      className="text-xs font-semibold uppercase tracking-wide text-foreground"
                    >
                      Bản đã làm sạch (Chỉnh sửa)
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={onCopyRefinedTranscript}
                      disabled={!shouldShowRefinedTranscript}
                      title="Copy bản hiện tại"
                    >
                      <CopyIcon className="size-3.5" />
                    </Button>
                  </div>
                  <textarea
                    id="transcript-draft"
                    value={transcriptDraft}
                    onChange={(e) => onTranscriptDraftChange(e.target.value)}
                    disabled={isSavingTranscript}
                    className="flex-1 resize-none overflow-auto rounded-lg border border-input bg-background px-4 py-3 text-sm leading-7 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    placeholder="Nhập nội dung transcript đã làm sạch..."
                  />
                </div>
              </div>

              <DialogFooter className="mx-0 mb-0 rounded-none border-t px-6 pb-6 pt-4 sm:justify-end">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    disabled={isSavingTranscript}
                    className="gap-1.5"
                  >
                    Hủy
                  </Button>
                </DialogClose>
                <Button
                  onClick={onSaveTranscriptDraft}
                  disabled={isSavingTranscript}
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                >
                  {isSavingTranscript ? (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  ) : null}
                  Lưu Transcript & Tính lại điểm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Mở toàn màn hình raw transcript"
                title="Mở toàn màn hình"
              >
                <Maximize2Icon className="size-4" />
              </Button>
            </DialogTrigger>

            <DialogContent
              showCloseButton={false}
              className="mb-4 flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col justify-between gap-0 rounded-xl p-0 sm:max-w-none"
            >
              <ScrollArea className="min-h-0 flex-1 overflow-hidden">
                <DialogHeader className="space-y-0 text-left">
                  <DialogTitle className="px-6 pt-6 text-base">
                    Đối chiếu transcript toàn phiên
                  </DialogTitle>
                  <DialogDescription className="px-6 pb-3 text-xs">
                    So sánh bản gốc và bản đã làm sạch để rà soát nhanh.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 px-6 pb-6 md:grid-cols-1">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        aria-label="Copy bản đã làm sạch"
                        title="Copy bản sạch"
                        onClick={onCopyRefinedTranscript}
                        disabled={!shouldShowRefinedTranscript}
                      >
                        <CopyIcon className="size-4" />
                      </Button>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Bản đã làm sạch
                      </p>
                    </div>
                    <p className="max-h-[55dvh] overflow-auto whitespace-pre-wrap rounded-md border border-border/60 bg-muted/20 p-4 text-sm leading-7 text-muted-foreground">
                      {refinedTranscript ?? "Chưa có bản làm sạch từ hệ thống."}
                    </p>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="mx-0 mb-0 rounded-none border-t px-6 pb-6 pt-4 sm:justify-end">
                <DialogClose asChild>
                  <Button variant="outline">
                    <ChevronLeftIcon className="size-4" />
                    Quay lại
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mt-2 grid gap-3 md:grid-cols-1">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Copy bản đã làm sạch"
              title="Copy bản sạch"
              onClick={onCopyRefinedTranscript}
              disabled={!shouldShowRefinedTranscript}
            >
              <CopyIcon className="size-4" />
            </Button>
            <p className="text-xs font-medium text-muted-foreground">
              Bản đã làm sạch
            </p>
          </div>
          <p className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-border/60 bg-muted/20 p-3 pr-2 text-sm leading-7 text-muted-foreground">
            {refinedTranscript ?? "Chưa có bản làm sạch từ hệ thống."}
          </p>
        </div>
      </div>
    </div>
  );
}
