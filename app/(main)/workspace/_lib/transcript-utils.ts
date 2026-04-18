import type { SpeakerSummary, TranscriptSegment } from "@/lib/types/meeting";

const DIARIZATION_LINE_PATTERN =
  /^Người\s*(\d+)\s*\(([\d.]+)s\s*-\s*([\d.]+)s\):\s*(.+)$/i;
const SPEAKER_TAG_PATTERN = /Người\s*\d+/i;

export function cleanTranscriptLine(line: string): string {
  return line.trim().replace(/^"+|"+$/g, "");
}

export function formatTimelineSecond(second: number): string {
  if (!Number.isFinite(second) || second < 0) {
    return "00:00";
  }

  const wholeSecond = Math.floor(second);
  const minute = Math.floor(wholeSecond / 60);
  const remainSecond = wholeSecond % 60;
  const millis = Math.round((second - wholeSecond) * 100);

  return `${String(minute).padStart(2, "0")}:${String(remainSecond).padStart(2, "0")}.${String(
    Math.max(0, Math.min(99, millis)),
  ).padStart(2, "0")}`;
}

export function parseTranscriptSegments(lines: string[]): TranscriptSegment[] {
  return lines
    .map((line, index) => {
      const normalizedLine = cleanTranscriptLine(line);
      const parsed = normalizedLine.match(DIARIZATION_LINE_PATTERN);

      if (!parsed) {
        return null;
      }

      const speakerIndex = parsed[1];
      const startSecond = Number.parseFloat(parsed[2]);
      const endSecond = Number.parseFloat(parsed[3]);
      const text = parsed[4]?.trim();

      if (
        !Number.isFinite(startSecond) ||
        !Number.isFinite(endSecond) ||
        !text
      ) {
        return null;
      }

      return {
        id: `seg-api-${index + 1}`,
        speaker: `Người ${speakerIndex}`,
        startSecond,
        endSecond,
        text,
      };
    })
    .filter((segment): segment is TranscriptSegment => Boolean(segment));
}

export function deriveSpeakerCount(
  lines: string[],
  segments: TranscriptSegment[],
): number {
  if (segments.length) {
    return new Set(segments.map((segment) => segment.speaker)).size;
  }

  const speakers = lines
    .map((line) =>
      cleanTranscriptLine(line).match(SPEAKER_TAG_PATTERN)?.[0]?.trim(),
    )
    .filter((speaker): speaker is string => Boolean(speaker));

  return new Set(speakers).size;
}

export function buildSpeakerSummariesFromSegments(
  segments: TranscriptSegment[],
  fallbackSummaries: SpeakerSummary[],
): SpeakerSummary[] {
  if (!segments.length) {
    return fallbackSummaries;
  }

  const groupedSegments = segments.reduce<Record<string, TranscriptSegment[]>>(
    (acc, segment) => {
      const key = segment.speaker;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(segment);
      return acc;
    },
    {},
  );

  return Object.entries(groupedSegments).map(([speaker, speakerSegments]) => ({
    speaker,
    keyPoints: [
      `Tham gia ${speakerSegments.length} lượt phát biểu trong phiên hiện tại.`,
      `Khung trao đổi chính: ${formatTimelineSecond(speakerSegments[0].startSecond)} - ${formatTimelineSecond(
        speakerSegments[speakerSegments.length - 1].endSecond,
      )}.`,
      "Đây là tóm tắt giả lập, sẽ thay bằng output agent ở bước sau.",
    ],
  }));
}
