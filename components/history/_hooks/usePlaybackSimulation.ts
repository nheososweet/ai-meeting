import { useEffect, useMemo, useState } from "react";

import type { MeetingRecord } from "@/lib/types/meeting";

export function usePlaybackSimulation(meeting: MeetingRecord) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSecond, setPlaybackSecond] = useState(0);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    meeting.segments[0]?.id ?? null,
  );

  const durationSecond = Math.max(meeting.durationSecond, 1);
  const playbackPercent = Math.min((playbackSecond / durationSecond) * 100, 100);

  const selectedSegment = useMemo(
    () =>
      selectedSegmentId
        ? meeting.segments.find((segment) => segment.id === selectedSegmentId)
        : undefined,
    [meeting.segments, selectedSegmentId],
  );

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = setInterval(() => {
      setPlaybackSecond((prev) => {
        if (prev >= durationSecond) {
          setIsPlaying(false);
          return durationSecond;
        }

        return prev + 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [durationSecond, isPlaying]);

  function handleTogglePlayback() {
    setIsPlaying((prev) => !prev);
  }

  function handleResetPlayback() {
    setIsPlaying(false);
    setPlaybackSecond(0);
  }

  function handleJumpToSegment(segmentId: string, startSecond: number) {
    setSelectedSegmentId(segmentId);
    setPlaybackSecond(startSecond);
  }

  return {
    isPlaying,
    playbackSecond,
    playbackPercent,
    selectedSegment,
    handleTogglePlayback,
    handleResetPlayback,
    handleJumpToSegment,
  };
}
