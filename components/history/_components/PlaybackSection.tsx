import {
  LoaderCircleIcon,
  MailIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatTimelineSecond } from "@/app/(main)/workspace/_lib/transcript-utils";
import type { MeetingRecord, TranscriptSegment } from "@/lib/types/meeting";

type PlaybackSectionProps = {
  meeting: MeetingRecord;
  emailStatusLabel: string;
  sendStatus: "idle" | "sending" | "sent" | "failed";
  isPlaying: boolean;
  playbackSecond: number;
  playbackPercent: number;
  selectedSegment?: TranscriptSegment;
  formatDuration: (seconds: number) => string;
  formatCreatedAt: (dateString: string) => string;
  onSendMinutes: () => void;
  onTogglePlayback: () => void;
  onResetPlayback: () => void;
};

export function PlaybackSection({
  meeting,
  emailStatusLabel,
  sendStatus,
  isPlaying,
  playbackSecond,
  playbackPercent,
  selectedSegment,
  formatDuration,
  formatCreatedAt,
  onSendMinutes,
  onTogglePlayback,
  onResetPlayback,
}: PlaybackSectionProps) {
  return (
    <section className="rounded-lg border border-border/80 bg-card p-5 shadow-sm xl:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {meeting.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meeting.fileName}
          </p>
        </div>
        <div className="space-y-2">
          <p className="rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-xs font-medium text-foreground">
            Email trạng thái: {emailStatusLabel}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={onSendMinutes}
            disabled={sendStatus === "sending"}
          >
            {sendStatus === "sending" ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <MailIcon className="size-4" />
            )}
            Gửi lại biên bản
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
        <p>
          <span className="font-medium text-foreground">Mã phiên:</span>{" "}
          {meeting.id}
        </p>
        <p>
          <span className="font-medium text-foreground">Thời gian:</span>{" "}
          {formatCreatedAt(meeting.createdAt)}
        </p>
        <p>
          <span className="font-medium text-foreground">Số speaker:</span>{" "}
          {meeting.speakerCount}
        </p>
        <p>
          <span className="font-medium text-foreground">Thời lượng:</span>{" "}
          {formatDuration(meeting.durationSecond)}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-border/70 bg-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="font-medium text-foreground">Mô phỏng playback audio</p>
          <p className="text-muted-foreground">
            {formatDuration(playbackSecond)} /{" "}
            {formatDuration(meeting.durationSecond)}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${playbackPercent}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={onTogglePlayback}
          >
            {isPlaying ? (
              <PauseIcon className="size-4" />
            ) : (
              <PlayIcon className="size-4" />
            )}
            {isPlaying ? "Tạm dừng" : "Phát"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={onResetPlayback}
          >
            <RotateCcwIcon className="size-4" />
            Reset
          </Button>
          {selectedSegment ? (
            <p className="rounded-md border border-border/70 px-2 py-1 text-xs text-muted-foreground">
              Đang focus: {selectedSegment.speaker} (
              {formatTimelineSecond(selectedSegment.startSecond)} -{" "}
              {formatTimelineSecond(selectedSegment.endSecond)})
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
