import { CopyIcon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TranscriptPreviewDialogProps = {
  open: boolean;
  transcriptRecordId: number | null;
  transcriptRecordFilename?: string;
  transcriptContent: string;
  isLoading: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  onCopyTranscript: () => void;
};

export function TranscriptPreviewDialog({
  open,
  transcriptRecordId,
  transcriptRecordFilename,
  transcriptContent,
  isLoading,
  onOpenChange,
  onCopyTranscript,
}: TranscriptPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="mb-2 flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col justify-between gap-0 overflow-hidden rounded-xl p-0 sm:mb-4 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)]"
      >
        <DialogHeader className="space-y-0 text-left">
          <DialogTitle className="px-4 pt-4 text-base sm:px-6 sm:pt-6">
            Xem nhanh transcript
          </DialogTitle>
          <DialogDescription className="px-4 pb-3 text-xs sm:px-6">
            {transcriptRecordFilename ??
              (transcriptRecordId ? `Bản ghi #${transcriptRecordId}` : "")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 sm:px-6 sm:pb-6">
          {transcriptRecordId && isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircleIcon className="size-4 animate-spin" />
              Đang tải nội dung transcript...
            </div>
          ) : (
            <pre className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-muted-foreground">
              {transcriptContent || "Chưa có nội dung transcript."}
            </pre>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-t px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            onClick={onCopyTranscript}
            disabled={!transcriptRecordId || isLoading}
          >
            <CopyIcon className="size-4" />
            Copy transcript
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Đóng
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
