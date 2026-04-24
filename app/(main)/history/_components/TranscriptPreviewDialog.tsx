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
import { getSpeakerColor } from "@/app/(main)/workspace/_lib/transcript-utils";

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
  function renderStyledTranscript(text: string) {
    if (!text) return null;

    return text.split("\n").map((line, idx) => {
      // Regex to match "Speaker Name (00:00 - 00:14): Text"
      const match = line.match(/^(.+?\s*\(.+?\)):(.*)$/);
      if (match) {
        const header = match[1];
        const content = match[2];
        const speakerNameMatch = header.match(/^(.+?)\s*\(/);
        const speakerName = speakerNameMatch ? speakerNameMatch[1].trim() : "";

        return (
          <div key={idx} className="mb-2 last:mb-0">
            <span className={`font-bold ${getSpeakerColor(speakerName)}`}>
              {header}:
            </span>
            <span className="ml-1.5">{content}</span>
          </div>
        );
      }
      return (
        <div key={idx} className="mb-1 italic opacity-70">
          {line}
        </div>
      );
    });
  }

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
            <div className="wrap-break-word text-sm leading-7 text-muted-foreground">
              {renderStyledTranscript(transcriptContent) ||
                "Chưa có nội dung transcript."}
            </div>
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
