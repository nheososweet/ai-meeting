import { ChevronLeftIcon, CopyIcon, Maximize2Icon } from "lucide-react";

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
import { getSpeakerColor } from "@/app/(main)/workspace/_lib/transcript-utils";

type TranscriptComparisonDialogProps = {
  rawTranscript: string;
  refinedTranscript?: string;
  shouldShowRefinedTranscript: boolean;
  onCopyRawTranscript: () => void;
  onCopyRefinedTranscript: () => void;
};

export function TranscriptComparisonDialog({
  rawTranscript,
  refinedTranscript,
  shouldShowRefinedTranscript,
  onCopyRawTranscript,
  onCopyRefinedTranscript,
}: TranscriptComparisonDialogProps) {
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
    <div className="mt-4 rounded-lg border border-border/70 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {/* <h3 className="text-sm font-semibold text-foreground">
            Đối chiếu transcript
          </h3> */}
          <h3 className="text-sm font-semibold text-foreground">
            Transcript
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
                  {/* <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        aria-label="Copy bản gốc từ nhận diện"
                        title="Copy bản gốc"
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
                    <div className="max-h-[55dvh] overflow-auto rounded-md border border-border/60 bg-secondary/50 p-4 text-sm leading-7 text-muted-foreground">
                      {renderStyledTranscript(
                        refinedTranscript ?? "Chưa có bản làm sạch từ hệ thống.",
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
              aria-label="Copy bản gốc từ nhận diện"
              title="Copy bản gốc"
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
          <div className="max-h-72 overflow-auto rounded-md border border-border/60 bg-secondary/50 p-3 pr-2 text-sm leading-7 text-muted-foreground">
            {renderStyledTranscript(
              refinedTranscript ?? "Chưa có bản làm sạch từ hệ thống.",
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
