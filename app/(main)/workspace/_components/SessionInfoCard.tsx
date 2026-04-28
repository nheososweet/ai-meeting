import { formatDuration } from "@/app/(main)/workspace/_lib/format-utils";
import type { MeetingRecord } from "@/lib/types/meeting";

type SessionInfoCardProps = {
  activeMeeting: MeetingRecord;
  isRecording: boolean;
  recordingElapsedMs: number;
};

export function SessionInfoCard({
  activeMeeting,
  isRecording,
  recordingElapsedMs,
}: SessionInfoCardProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-secondary/50 p-4">
      <h2 className="text-sm font-semibold text-foreground">
        Thông tin phiên hiện tại
      </h2>
      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <p>
          <span className="font-medium text-foreground">Tiêu đề:</span>{" "}
          {activeMeeting.title}
        </p>
        <p>
          <span className="font-medium text-foreground">Nguồn vào:</span>{" "}
          {activeMeeting.inputSource === "upload" ? "Tải tệp" : "Thu âm"}
        </p>
        <p>
          <span className="font-medium text-foreground">Số người nói:</span>{" "}
          {activeMeeting.speakerCount}
        </p>
        <p>
          <span className="font-medium text-foreground">Thời lượng:</span>{" "}
          {formatDuration(
            isRecording
              ? Math.max(1, Math.round(recordingElapsedMs / 1000))
              : activeMeeting.durationSecond,
          )}
        </p>
      </div>
    </div>
  );
}
