"use client";

import { useRef, useState } from "react";
import { CopyIcon, LoaderCircleIcon, PauseIcon, PlayIcon, UsersIcon } from "lucide-react";

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
import { formatHeaderTimestamp } from "@/app/(main)/workspace/_lib/format-utils";
import { getSpeakerColor } from "@/app/(main)/workspace/_lib/transcript-utils";

type TranscriptPreviewDialogProps = {
  open: boolean;
  transcriptRecordId: number | null;
  transcriptRecordFilename?: string;
  transcriptContent: string;
  isLoading: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  onCopyTranscript: () => void;
  onOpenLabeling?: () => void;
  audioUrl?: string;
};

function parseSecondsFromHeader(header: string): { start: number; end: number } | null {
  const secMatch = header.match(/\(([\d.]+)s\s*-\s*([\d.]+)s\)/);
  if (secMatch) {
    return { start: parseFloat(secMatch[1]), end: parseFloat(secMatch[2]) };
  }
  const mmssMatch = header.match(/\((\d+):(\d+)\s*-\s*(\d+):(\d+)\)/);
  if (mmssMatch) {
    return {
      start: parseInt(mmssMatch[1]) * 60 + parseInt(mmssMatch[2]),
      end: parseInt(mmssMatch[3]) * 60 + parseInt(mmssMatch[4]),
    };
  }
  return null;
}

export function TranscriptPreviewDialog({
  open,
  transcriptRecordId,
  transcriptRecordFilename,
  transcriptContent,
  isLoading,
  onOpenChange,
  onCopyTranscript,
  onOpenLabeling,
  audioUrl,
}: TranscriptPreviewDialogProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);

  function playSegment(segmentId: string, start: number, end: number) {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingSegmentId === segmentId && !audio.paused) {
      audio.pause();
      setPlayingSegmentId(null);
      return;
    }

    audio.pause();
    audio.currentTime = start;
    setPlayingSegmentId(segmentId);

    audio.ontimeupdate = () => {
      if (audio.currentTime >= end) {
        audio.pause();
        audio.ontimeupdate = null;
        setPlayingSegmentId(null);
      }
    };

    void audio.play();
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.ontimeupdate = null;
      }
      setPlayingSegmentId(null);
    }
    onOpenChange(nextOpen);
  }

  function renderStyledTranscript(text: string) {
    if (!text) return null;

    return text.split("\n").map((line, idx) => {
      const match = line.match(/^(.+?\s*\(.+?\)):(.*)$/);
      if (match) {
        const header = match[1];
        const content = match[2];
        const speakerNameMatch = header.match(/^(.+?)\s*\(/);
        const speakerName = speakerNameMatch ? speakerNameMatch[1].trim() : "";
        const segmentId = `seg-${idx}`;
        const timestamps = audioUrl ? parseSecondsFromHeader(header) : null;

        return (
          <div key={idx} className="mb-2 last:mb-0">
            <span className={`font-bold ${getSpeakerColor(speakerName)}`}>
              {formatHeaderTimestamp(header)}:
            </span>
            {timestamps && (
              <button
                onClick={() => playSegment(segmentId, timestamps.start, timestamps.end)}
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="mb-2 flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col justify-between gap-0 overflow-hidden rounded-xl p-0 sm:mb-4 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)]"
      >
        <DialogHeader className="space-y-0 text-left">
          <DialogTitle className="px-4 pt-4 text-base sm:px-6 sm:pt-6">
            Xem nhanh bản gỡ băng
          </DialogTitle>
          <DialogDescription className="px-4 pb-3 text-xs sm:px-6">
            {transcriptRecordFilename ??
              (transcriptRecordId ? `Bản ghi #${transcriptRecordId}` : "")}
          </DialogDescription>
        </DialogHeader>

        {audioUrl && (
          <div className="border-b border-border/60 bg-muted/5 px-4 py-2 sm:px-6">
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              preload="metadata"
              onPause={() => setPlayingSegmentId(null)}
              onEnded={() => setPlayingSegmentId(null)}
              className="h-10 w-full accent-primary"
            />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 sm:px-6 sm:pb-6">
          {transcriptRecordId && isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircleIcon className="size-4 animate-spin" />
              Đang tải nội dung bản gỡ băng...
            </div>
          ) : (
            <div className="wrap-break-word text-sm leading-7 text-muted-foreground">
              {renderStyledTranscript(transcriptContent) ||
                "Chưa có nội dung bản gỡ băng."}
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
            Sao chép bản gỡ băng
          </Button>
          {onOpenLabeling && (
            <Button
              type="button"
              variant="outline"
              className="gap-1.5 border-dashed border-blue-200 bg-blue-50/30 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400"
              onClick={onOpenLabeling}
              disabled={!transcriptRecordId || isLoading}
            >
              <UsersIcon className="size-4" />
              Gán nhãn người
            </Button>
          )}
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
