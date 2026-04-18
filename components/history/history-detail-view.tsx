"use client";

import { useState } from "react";

import { EmailLogSection } from "@/components/history/_components/EmailLogSection";
import { MinutesSection } from "@/components/history/_components/MinutesSection";
import { PlaybackSection } from "@/components/history/_components/PlaybackSection";
import { TranscriptSegmentsSection } from "@/components/history/_components/TranscriptSegmentsSection";
import { usePlaybackSimulation } from "@/components/history/_hooks/usePlaybackSimulation";
import type {
  EmailStatus,
  MeetingEmailLog,
  MeetingRecord,
} from "@/lib/types/meeting";

const formatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatMeetingDateTime(dateString: string): string {
  return formatter.format(new Date(dateString));
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes} phút ${String(remainSeconds).padStart(2, "0")} giây`;
}

function resolveEmailStatusLabel(status: EmailStatus): string {
  if (status === "sent") {
    return "Đã gửi";
  }

  if (status === "failed") {
    return "Lỗi gửi";
  }

  return "Chưa gửi";
}

export function HistoryDetailView({ meeting }: { meeting: MeetingRecord }) {
  const [minutesText, setMinutesText] = useState(meeting.minutes);
  const [recipient, setRecipient] = useState(
    meeting.emailLogs[0]?.recipient ?? "team-core@company.vn",
  );
  const [emailLogs, setEmailLogs] = useState<MeetingEmailLog[]>(
    meeting.emailLogs,
  );
  const [emailStatus, setEmailStatus] = useState<EmailStatus>(
    meeting.emailStatus,
  );
  const [sendStatus, setSendStatus] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");
  const {
    isPlaying,
    playbackSecond,
    playbackPercent,
    selectedSegment,
    handleTogglePlayback,
    handleResetPlayback,
    handleJumpToSegment,
  } = usePlaybackSimulation(meeting);

  function handleSendMinutes() {
    if (sendStatus === "sending") {
      return;
    }

    if (!recipient.includes("@")) {
      setSendStatus("failed");
      setEmailStatus("failed");
      return;
    }

    setSendStatus("sending");

    setTimeout(() => {
      const log: MeetingEmailLog = {
        id: `email-${Date.now()}`,
        recipient,
        sentAt: new Date().toISOString(),
        status: "sent",
      };

      setEmailLogs((prev) => [log, ...prev]);
      setEmailStatus("sent");
      setSendStatus("sent");
    }, 1100);
  }

  function handleRefreshMinutes() {
    setMinutesText(
      `${meeting.minutes}\n4) Tổng hợp rủi ro mở và cập nhật người chịu trách nhiệm chính.`,
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <PlaybackSection
        meeting={meeting}
        emailStatusLabel={resolveEmailStatusLabel(emailStatus)}
        sendStatus={sendStatus}
        isPlaying={isPlaying}
        playbackSecond={playbackSecond}
        playbackPercent={playbackPercent}
        selectedSegment={selectedSegment}
        formatDuration={formatDuration}
        formatCreatedAt={formatMeetingDateTime}
        onSendMinutes={handleSendMinutes}
        onTogglePlayback={handleTogglePlayback}
        onResetPlayback={handleResetPlayback}
      />

      <TranscriptSegmentsSection
        meeting={meeting}
        onJumpToSegment={handleJumpToSegment}
      />

      <MinutesSection
        minutesText={minutesText}
        speakerSummaries={meeting.speakerSummaries}
        onRefreshMinutes={handleRefreshMinutes}
      />

      <EmailLogSection
        recipient={recipient}
        sendStatus={sendStatus}
        emailLogs={emailLogs}
        onRecipientChange={setRecipient}
        onSendMinutes={handleSendMinutes}
        formatEmailSentAt={formatMeetingDateTime}
      />
    </div>
  );
}
