import type { SpeakerSummary, TranscriptSegment } from "@/lib/types/meeting";

const DIARIZATION_LINE_PATTERN =
  /^(.+?)\s*\(([\d.]+)s\s*-\s*([\d.]+)s\):\s*(.+)$/i;
const SPEAKER_TAG_PATTERN = /^(.+?)\s*\(/i;

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

  return `${String(minute).padStart(2, "0")}:${String(remainSecond).padStart(2, "0")}`;
}

export function parseTranscriptSegments(lines: string[]): TranscriptSegment[] {
  return lines
    .map((line, index) => {
      const normalizedLine = cleanTranscriptLine(line);
      const parsed = normalizedLine.match(DIARIZATION_LINE_PATTERN);

      if (!parsed) {
        return null;
      }

      const speakerName = parsed[1]?.trim();
      const startSecond = Number.parseFloat(parsed[2]);
      const endSecond = Number.parseFloat(parsed[3]);
      const text = parsed[4]?.trim();

      if (
        !speakerName ||
        !Number.isFinite(startSecond) ||
        !Number.isFinite(endSecond) ||
        !text
      ) {
        return null;
      }

      return {
        id: `seg-api-${index + 1}`,
        speaker: speakerName,
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

/**
 * Re-format timestamps in a raw transcript string from (Xs - Ys) to (mm:ss - mm:ss)
 * This is for display purposes only and should not be used to modify the canonical state.
 */
export function reformatTranscriptTimestamps(text: string): string {
  if (!text) return "";

  // Pattern matches "(0.0s - 14.08s)" or "(0.0s)"
  return text.replace(/\(([\d.]+)s(?:\s*-\s*([\d.]+)s)?\)/gi, (match, start, end) => {
    const startVal = Number.parseFloat(start);
    const startFormatted = formatTimelineSecond(startVal);

    if (end) {
      const endVal = Number.parseFloat(end);
      const endFormatted = formatTimelineSecond(endVal);
      return `(${startFormatted} - ${endFormatted})`;
    }

    return `(${startFormatted})`;
  });
}

/**
 * Get visual style classes for a speaker based on their name.
 */
export function getSpeakerColor(speaker: string): string {
  const palette = [
    "text-sky-600 dark:text-sky-400",
    "text-emerald-600 dark:text-emerald-400",
    "text-amber-600 dark:text-amber-400",
    "text-indigo-600 dark:text-indigo-400",
    "text-rose-600 dark:text-rose-400",
    "text-teal-600 dark:text-teal-400",
    "text-fuchsia-600 dark:text-fuchsia-400",
    "text-orange-600 dark:text-orange-400",
  ];

  const hash = speaker
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length] ?? palette[0];
}

/**
 * Get initials from a speaker's name.
 */
export function getSpeakerInitials(speaker: string): string {
  if (!speaker) return "?";
  const parts = speaker.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  if (parts[0].toLowerCase() === "người" && parts.length > 1) return `N${parts[parts.length - 1]}`;
  return (first + last).toUpperCase();
}