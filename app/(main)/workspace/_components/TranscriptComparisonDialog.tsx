import { ChevronLeftIcon, CopyIcon, Maximize2Icon, PauseIcon, PlayIcon } from "lucide-react";

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
import { formatHeaderTimestamp } from "@/app/(main)/workspace/_lib/format-utils";
import { getSpeakerColor } from "@/app/(main)/workspace/_lib/transcript-utils";

type TranscriptComparisonDialogProps = {
  rawTranscript: string;
  refinedTranscript?: string;
  shouldShowRefinedTranscript: boolean;
  onCopyRawTranscript: () => void;
  onCopyRefinedTranscript: () => void;
  audioUrl?: string;
  onPlaySegment?: (segmentId: string, start: number, end: number) => void;
  playingSegmentId?: string | null;
};

function parseSecondsFromHeader(header: string): { start: number; end: number } | null {
  // Format: (12.5s - 45.3s)
  const secMatch = header.match(/\(([\d.]+)s\s*-\s*([\d.]+)s\)/);
  if (secMatch) {
    return { start: parseFloat(secMatch[1]), end: parseFloat(secMatch[2]) };
  }
  // Format: (00:12 - 00:45)
  const mmssMatch = header.match(/\((\d+):(\d+)\s*-\s*(\d+):(\d+)\)/);
  if (mmssMatch) {
    return {
      start: parseInt(mmssMatch[1]) * 60 + parseInt(mmssMatch[2]),
      end: parseInt(mmssMatch[3]) * 60 + parseInt(mmssMatch[4]),
    };
  }
  return null;
}

export function TranscriptComparisonDialog({
  rawTranscript,
  refinedTranscript,
  shouldShowRefinedTranscript,
  onCopyRawTranscript,
  onCopyRefinedTranscript,
  audioUrl,
  onPlaySegment,
  playingSegmentId,
}: TranscriptComparisonDialogProps) {
  function renderStyledTranscript(text: string, idPrefix: string) {
    if (!text) return null;

    return text.split("\n").map((line, idx) => {
      const match = line.match(/^(.+?\s*\(.+?\)):(.*)$/);
      if (match) {
        const header = match[1];
        const content = match[2];
        const speakerNameMatch = header.match(/^(.+?)\s*\(/);
        const speakerName = speakerNameMatch ? speakerNameMatch[1].trim() : "";
        const segmentId = `${idPrefix}-${idx}`;
        const timestamps = audioUrl ? parseSecondsFromHeader(header) : null;

        return (
          <div key={idx} className="mb-2 last:mb-0">
            <span className={`font-bold ${getSpeakerColor(speakerName)}`}>
              {formatHeaderTimestamp(header)}:
            </span>
            {timestamps && onPlaySegment && (
              <button
                onClick={() => onPlaySegment(segmentId, timestamps.start, timestamps.end)}
                className="ml-1.5 inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-primary"
                title="Nghe đoạn này"
              >
                {playingSegmentId === segmentId ? (
                  <PauseIcon className="size-3" />
                ) : (
                  <PlayIcon className="size-3" />
                )}
              </button>
            )}
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
    <div className="mt-4 rounded-lg border border-border/70 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {/* <h3 className="text-sm font-semibold text-foreground">
            Đối chiếu transcript
          </h3> */}
          <h3 className="text-sm font-semibold text-foreground">
            Bản gỡ băng
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Mở toàn màn hình bản gỡ băng gốc"
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
                    Đối chiếu bản gỡ băng toàn phiên
                  </DialogTitle>
                  <DialogDescription className="px-6 pb-3 text-xs">
                    So sánh bản gốc và bản đã làm sạch để rà soát nhanh.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 px-6 pb-6 md:grid-cols-1">
                  {/* <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        aria-label="Sao chép bản gốc"
                        title="Sao chép bản gốc"
                        onClick={onCopyRawTranscript}
                      >
                        <CopyIcon className="size-4" />
                      </Button>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Bản gốc từ nhận diện
                      </p>
                    </div>
                    <p className="max-h-[55dvh] overflow-auto whitespace-pre-wrap rounded-md border border-border/60 bg-muted/20 p-4 text-sm leading-7 text-muted-foreground">
                      {rawTranscript}
                    </p>
                  </div> */}

                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        aria-label="Sao chép bản đã làm sạch"
                        title="Sao chép bản làm sạch"
                        onClick={onCopyRefinedTranscript}
                        disabled={!shouldShowRefinedTranscript}
                      >
                        <CopyIcon className="size-4" />
                      </Button>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Bản đã làm sạch
                      </p>
                    </div>
                    <div className="max-h-[55dvh] overflow-auto rounded-md border border-border/60 bg-secondary/50 p-4 text-sm leading-7 text-muted-foreground">
                      {renderStyledTranscript(
                        refinedTranscript ?? "Chưa có bản làm sạch từ hệ thống.",
                        "dialog",
                      )}
                    </div>
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
        {/* <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Sao chép bản gốc"
              title="Sao chép bản gốc"
              onClick={onCopyRawTranscript}
            >
              <CopyIcon className="size-4" />
            </Button>
            <p className="text-xs font-medium text-muted-foreground">
              Bản gốc từ nhận diện
            </p>
          </div>
          <p className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-border/60 bg-muted/20 p-3 pr-2 text-sm leading-7 text-muted-foreground">
            {rawTranscript}
          </p>
        </div> */}

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Sao chép bản đã làm sạch"
              title="Sao chép bản làm sạch"
              onClick={onCopyRefinedTranscript}
              disabled={!shouldShowRefinedTranscript}
            >
              <CopyIcon className="size-4" />
            </Button>
            <p className="text-xs font-medium text-muted-foreground">
              Bản đã làm sạch
            </p>
          </div>
          <div className="rounded-md border border-border/60 bg-secondary/50 p-3 pr-2 text-sm leading-7 text-muted-foreground">
            {renderStyledTranscript(
              refinedTranscript ?? "Chưa có bản làm sạch từ hệ thống.",
              "inline",
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
