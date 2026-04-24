import { Separator } from "@/components/ui/separator";
import {
  formatTimelineSecond,
  reformatTranscriptTimestamps,
} from "@/app/(main)/workspace/_lib/transcript-utils";
import type { MeetingRecord } from "@/lib/types/meeting";

type TranscriptSegmentsSectionProps = {
  meeting: MeetingRecord;
  onJumpToSegment: (segmentId: string, startSecond: number) => void;
};

export function TranscriptSegmentsSection({
  meeting,
  onJumpToSegment,
}: TranscriptSegmentsSectionProps) {
  return (
    <article className="rounded-lg border border-border/80 bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">
        Raw transcript
      </h2>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">
        {reformatTranscriptTimestamps(meeting.rawTranscript)}
      </p>

      <Separator className="my-4" />

      <h3 className="text-sm font-semibold text-foreground">
        Đoạn theo người nói
      </h3>
      <ul className="mt-3 space-y-2">
        {meeting.segments.length ? (
          meeting.segments.map((segment) => (
            <li
              key={segment.id}
              className="rounded-md border border-border/70 p-3 text-sm"
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => onJumpToSegment(segment.id, segment.startSecond)}
              >
                <p className="font-semibold text-foreground">
                  {segment.speaker}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTimelineSecond(segment.startSecond)} -{" "}
                  {formatTimelineSecond(segment.endSecond)}
                </p>
                <p className="mt-1 text-muted-foreground">{segment.text}</p>
              </button>
            </li>
          ))
        ) : (
          <li className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Chưa có đoạn transcript theo speaker.
          </li>
        )}
      </ul>
    </article>
  );
}
