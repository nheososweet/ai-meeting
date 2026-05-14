import { UserRoundIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { reformatTranscriptTimestamps } from "@/app/(main)/workspace/_lib/transcript-utils";
import type { SpeakerSummary } from "@/lib/types/meeting";

type MinutesSectionProps = {
  minutesText: string;
  speakerSummaries: SpeakerSummary[];
  onRefreshMinutes: () => void;
};

export function MinutesSection({
  minutesText,
  speakerSummaries,
  onRefreshMinutes,
}: MinutesSectionProps) {
  return (
    <article className="rounded-lg border border-border/80 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Biên bản điều hành
        </h2>
        <Button size="sm" variant="outline" onClick={onRefreshMinutes}>
          Làm mới biên bản
        </Button>
      </div>

      <div className="mt-3 rounded-md border border-border/60 bg-secondary/50 p-3 shadow-inner">
        <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
          {reformatTranscriptTimestamps(minutesText)}
        </p>
      </div>

      <Separator className="my-4" />

      <h3 className="text-sm font-semibold text-foreground">
        Tóm tắt theo speaker
      </h3>
      <ul className="mt-3 space-y-3">
        {speakerSummaries.length ? (
          speakerSummaries.map((summary) => (
            <li
              key={summary.speaker}
              className="rounded-md border border-border/70 p-3 text-sm"
            >
              <p className="flex items-center gap-1.5 font-semibold text-foreground">
                <UserRoundIcon className="size-4" />
                {summary.speaker}
              </p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {summary.keyPoints.map((point) => (
                  <li key={point}>- {reformatTranscriptTimestamps(point)}</li>
                ))}
              </ul>
            </li>
          ))
        ) : (
          <li className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Chưa có tóm tắt theo speaker.
          </li>
        )}
      </ul>
    </article>
  );
}
