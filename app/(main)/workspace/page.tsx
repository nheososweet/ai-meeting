"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, Maximize2Icon, XIcon } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { RecordingPanel } from "@/components/workspace/recording-panel";
import { UploadPanel } from "@/components/workspace/upload-panel";
import { EmailDialog } from "@/app/(main)/workspace/_components/EmailDialog";
import { MinutesEditorDialog } from "@/app/(main)/workspace/_components/MinutesEditorDialog";
import { PipelineProgressCard } from "@/app/(main)/workspace/_components/PipelineProgressCard";
import { SessionInfoCard } from "@/app/(main)/workspace/_components/SessionInfoCard";
import { TranscriptComparisonDialog } from "@/app/(main)/workspace/_components/TranscriptComparisonDialog";
import {
  formatDuration,
  formatFileSize,
  statusConfig,
} from "@/app/(main)/workspace/_lib/format-utils";
import { PIPELINE_STEP_WEIGHT } from "@/app/(main)/workspace/_lib/pipeline-constants";
import { SpeakersLabelingDialog } from "@/app/(main)/workspace/_components/SpeakersLabelingDialog";
import {
  cleanTranscriptLine,
  formatTimelineSecond,
  parseTranscriptSegments,
  reformatTranscriptTimestamps,
} from "@/app/(main)/workspace/_lib/transcript-utils";
import {
  minutesDraftSchema,
  recipientEmailsSchema,
} from "@/app/(main)/workspace/_lib/validation";
import { useWorkspaceRecording } from "@/app/(main)/workspace/_hooks/useWorkspaceRecording";
import { useWorkspacePipeline } from "@/app/(main)/workspace/_hooks/useWorkspacePipeline";
import { useWorkspaceToast } from "@/app/(main)/workspace/_hooks/useWorkspaceToast";
import { useWorkspaceUpload } from "@/app/(main)/workspace/_hooks/useWorkspaceUpload";
import { useDiarizeTranscribeMutation } from "@/hooks/services/use-diarize-transcribe-mutation";
import { useSummaryMinutesMutation } from "@/hooks/services/use-summary-minutes-mutation";
import { useUpdateReportMutation } from "@/hooks/services/use-update-report-mutation";
import { meetingRecords } from "@/lib/mock/meetings";
import { sendMail } from "@/services/pipeline-records.service";
import type {
  AudioInputSource,
  MeetingMailTemplate,
  MeetingRecord,
  TranscriptSegment,
} from "@/lib/types/meeting";

const sourceMeeting = meetingRecords[0];
const DEFAULT_EMAIL_SUBJECT_PREFIX = "Thông báo Biên bản Họp";
const DEFAULT_EMAIL_BODY =
  '<p>Kính gửi Quý thành viên,</p><p>Liên quan đến cuộc họp vừa diễn ra, Ban tổ chức xin gửi đến Quý vị Biên bản họp chi tiết.</p><p>Vui lòng truy cập liên kết sau để xem hoặc tải tài liệu:</p><p><a href="{{mom_file_url}}">{{mom_file_url}}</a></p><p>Mọi thắc mắc vui lòng phản hồi trực tiếp cho Thư ký.</p><p>Trân trọng,</p><p>Admin</p>';

function speakerToneClass(speaker: string): string {
  const palette = [
    "border-l-sky-500 bg-sky-50/80 dark:border-l-sky-300 dark:bg-sky-950/40",
    "border-l-emerald-500 bg-emerald-50/80 dark:border-l-emerald-300 dark:bg-emerald-950/40",
    "border-l-amber-500 bg-amber-50/80 dark:border-l-amber-300 dark:bg-amber-950/40",
    "border-l-teal-500 bg-teal-50/80 dark:border-l-teal-300 dark:bg-teal-950/40",
  ];
  const hash = speaker
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length] ?? palette[0];
}

function buildDefaultMailTemplate(meetingTitle: string): MeetingMailTemplate {
  const cleanTitle = meetingTitle.trim();

  return {
    subject: cleanTitle
      ? `${DEFAULT_EMAIL_SUBJECT_PREFIX} - ${cleanTitle}`
      : DEFAULT_EMAIL_SUBJECT_PREFIX,
    body: DEFAULT_EMAIL_BODY,
    isHtml: true,
  };
}

function resolveMailTemplate(
  template: MeetingMailTemplate | undefined,
  meetingTitle: string,
): MeetingMailTemplate {
  const fallback = buildDefaultMailTemplate(meetingTitle);

  if (!template) {
    return fallback;
  }

  return {
    subject: template.subject.trim() || fallback.subject,
    body: template.body.trim() || fallback.body,
    isHtml: template.isHtml,
  };
}

const initialMeeting: MeetingRecord = {
  ...sourceMeeting,
  title: "Phiên mới chưa xử lý",
  fileName: "Chưa có tệp nguồn",
  inputSource: "upload",
  processingStatus: "idle",
  emailStatus: "not_sent",
  rawTranscript:
    "Transcript sẽ hiển thị sau khi bạn tải tệp hoặc hoàn tất bản thu trực tiếp.",
  refinedTranscript:
    "Bản làm sạch sẽ hiển thị sau khi hệ thống xử lý xong transcript gốc.",
  segments: [],
  minutes: "Biên bản điều hành sẽ được sinh sau khi xử lý hoàn tất.",
  speakerSummaries: [],
  emailLogs: [],
  durationSecond: 0,
  speakerCount: 0,
  mailTemplate: buildDefaultMailTemplate(""),
};

export default function WorkspacePage() {
  const diarizeTranscribeMutation = useDiarizeTranscribeMutation();
  const summaryMinutesMutation = useSummaryMinutesMutation();
  const updateReportMutation = useUpdateReportMutation();
  const [inputMode, setInputMode] = useState<AudioInputSource>("upload");
  const [activeMeeting, setActiveMeeting] =
    useState<MeetingRecord>(initialMeeting);
  const [, setUploadProgress] = useState(0);
  const [, setProcessingProgress] = useState(0);
  const [notice, setNotice] = useState(
    "Sẵn sàng nhận tệp hoặc bắt đầu thu âm trực tiếp.",
  );
  const [emailRecipientsInput, setEmailRecipientsInput] = useState("");
  const [emailValidationError, setEmailValidationError] = useState<
    string | null
  >(null);
  const [emailTemplateValidationError, setEmailTemplateValidationError] =
    useState<string | null>(null);
  const [emailSubjectInput, setEmailSubjectInput] = useState(
    buildDefaultMailTemplate("").subject,
  );
  const [emailBodyInput, setEmailBodyInput] = useState(
    buildDefaultMailTemplate("").body,
  );
  const [emailIsHtml, setEmailIsHtml] = useState(true);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isMinutesDialogOpen, setIsMinutesDialogOpen] = useState(false);
  const [minutesDraft, setMinutesDraft] = useState(initialMeeting.minutes);
  const [minutesValidationError, setMinutesValidationError] = useState<
    string | null
  >(null);
  const [isSavingMinutes, setIsSavingMinutes] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const busyProcessing =
    activeMeeting.processingStatus === "uploading" ||
    activeMeeting.processingStatus === "processing";

  const { actionToast, showActionToast, hideActionToast } = useWorkspaceToast();

  const {
    pipelineSteps,
    failedStepId,
    resetPipelineSteps,
    setFailedStepId,
    startProcessing,
    retryPipeline,
  } = useWorkspacePipeline({
    sourceMeeting,
    setActiveMeeting,
    setMinutesDraft,
    setNotice,
    setUploadProgress,
    setProcessingProgress,
    diarizeTranscribeMutation,
    summaryMinutesMutation,
    updateReportMutation,
  });

  const {
    selectedFile,
    selectedFileName,
    selectedFileSizeBytes,
    selectedFileDurationSecond,
    filePreviewUrl,
    uploadWarning,
    isDraggingUpload,
    fileInputRef,
    clearUploadState,
    handleFileChange,
    handleUploadDragEnter,
    handleUploadDragOver,
    handleUploadDragLeave,
    handleUploadDrop,
    handleClearSelectedFile,
  } = useWorkspaceUpload({
    busyProcessing,
    initialMeeting,
    setActiveMeeting,
    onResetPipelineSteps: resetPipelineSteps,
    onResetFailedStep: () => setFailedStepId(null),
    onResetProgress: () => {
      setUploadProgress(0);
      setProcessingProgress(0);
    },
    onSetNotice: setNotice,
  });

  const {
    isRecording,
    recordingElapsedMs,
    recordingSecond,
    recordingPreviewUrl,
    recordingFile,
    clearRecordingState,
    handleToggleRecording,
    handleClearRecording,
  } = useWorkspaceRecording({
    busyProcessing,
    initialMeeting,
    setInputMode,
    setActiveMeeting,
    onClearUploadState: clearUploadState,
    onResetPipelineSteps: resetPipelineSteps,
    onSetNotice: setNotice,
  });

  const status = statusConfig(activeMeeting.processingStatus);
  const stageProgress = useMemo(() => {
    if (activeMeeting.processingStatus === "completed") {
      return 100;
    }

    if (activeMeeting.processingStatus === "idle") {
      return 0;
    }

    const weightedProgress = pipelineSteps.reduce((acc, step) => {
      const weight = PIPELINE_STEP_WEIGHT[step.id] ?? 0;
      return acc + (step.progress * weight) / 100;
    }, 0);

    return Math.max(0, Math.min(100, Math.round(weightedProgress)));
  }, [activeMeeting.processingStatus, pipelineSteps]);

  const selectedFileSizeLabel = selectedFileSizeBytes
    ? formatFileSize(selectedFileSizeBytes)
    : "--";
  const selectedFileDurationLabel = selectedFileDurationSecond
    ? formatDuration(selectedFileDurationSecond)
    : "Đang đọc thời lượng...";
  const recordingDurationLabel = formatDuration(
    isRecording
      ? Math.max(1, Math.round(recordingElapsedMs / 1000))
      : recordingSecond,
  );
  const shouldShowPipeline = activeMeeting.processingStatus !== "idle";
  const shouldShowMinutes = activeMeeting.minutes !== initialMeeting.minutes;
  const shouldShowRawTranscript =
    activeMeeting.rawTranscript !== initialMeeting.rawTranscript;
  const shouldShowRefinedTranscript =
    Boolean(activeMeeting.refinedTranscript?.trim()) &&
    activeMeeting.refinedTranscript !== initialMeeting.refinedTranscript;
  const canSendEmail =
    activeMeeting.processingStatus === "completed" &&
    Boolean(activeMeeting.reportUrl?.trim());
  const shouldShowDiarization = activeMeeting.segments.length > 0;
  const shouldShowSpeakerSummary = activeMeeting.speakerSummaries.length > 0;
  const canRetryPipeline = Boolean(failedStepId) && !busyProcessing;
  const refinedSegments = useMemo(() => {
    const refinedText = (activeMeeting.refinedTranscript ?? "").trim();

    if (!refinedText) {
      return [] as TranscriptSegment[];
    }

    const refinedLines = refinedText
      .split("\n")
      .map((line) => cleanTranscriptLine(line))
      .filter((line) => line.length > 0);

    return parseTranscriptSegments(refinedLines);
  }, [activeMeeting.refinedTranscript]);
  const shouldShowRefinedDiarization = refinedSegments.length > 0;

  useEffect(() => {
    const nextTemplate = resolveMailTemplate(
      activeMeeting.mailTemplate,
      activeMeeting.title,
    );

    setEmailSubjectInput(nextTemplate.subject);
    setEmailBodyInput(nextTemplate.body);
    setEmailIsHtml(nextTemplate.isHtml);
  }, [activeMeeting.mailTemplate, activeMeeting.title]);

  function handleRetryPipeline() {
    retryPipeline({
      busyProcessing,
      activeMeeting,
      selectedFile,
      selectedFileName,
      selectedFileDurationSecond,
      recordingFile,
      recordingSecond,
    });
  }

  async function handleCopyRawTranscript() {
    const transcript = activeMeeting.rawTranscript.trim();

    if (!transcript) {
      showActionToast("Chưa có transcript để copy.");
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(transcript);
      } else if (typeof document !== "undefined") {
        const textArea = document.createElement("textarea");
        textArea.value = transcript;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      showActionToast("Đã copy raw transcript.");
    } catch {
      showActionToast("Copy thất bại, vui lòng thử lại.");
    }
  }

  async function handleCopyRefinedTranscript() {
    const transcript = (activeMeeting.refinedTranscript ?? "").trim();

    if (!transcript) {
      showActionToast("Chưa có bản đã làm sạch để copy.");
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(transcript);
      } else if (typeof document !== "undefined") {
        const textArea = document.createElement("textarea");
        textArea.value = transcript;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      showActionToast("Đã copy bản đã làm sạch.");
    } catch {
      showActionToast("Copy thất bại, vui lòng thử lại.");
    }
  }

  function handleSwitchMode(mode: AudioInputSource) {
    if (mode === inputMode) {
      return;
    }

    if (busyProcessing) {
      setNotice("Không thể đổi chế độ khi pipeline đang xử lý.");
      return;
    }

    if (mode === "upload") {
      clearRecordingState();
      setActiveMeeting((prev) => ({
        ...prev,
        title: "Phiên mới chưa xử lý",
        fileName: "Chưa có tệp nguồn",
        inputSource: "upload",
        processingStatus: "idle",
        rawTranscript: initialMeeting.rawTranscript,
        refinedTranscript: initialMeeting.refinedTranscript,
        segments: [],
        speakerSummaries: [],
        minutes: initialMeeting.minutes,
        speakerCount: 0,
        durationSecond: 0,
        mailTemplate: buildDefaultMailTemplate(""),
      }));
      setInputMode("upload");
      return;
    }

    clearUploadState();
    setActiveMeeting((prev) => ({
      ...prev,
      title: "Bản thu sẵn sàng",
      fileName: "Chưa có bản ghi",
      inputSource: "recording",
      processingStatus: "idle",
      rawTranscript: initialMeeting.rawTranscript,
      refinedTranscript: initialMeeting.refinedTranscript,
      segments: [],
      speakerSummaries: [],
      minutes: initialMeeting.minutes,
      speakerCount: 0,
      durationSecond: 0,
      mailTemplate: buildDefaultMailTemplate(""),
    }));
    setInputMode("recording");
  }

  function handleProcessSelectedFile() {
    if (!selectedFile || !selectedFileName) {
      setNotice("Vui lòng chọn tệp audio trước khi xử lý.");
      return;
    }

    if (isRecording) {
      setNotice("Hãy dừng thu âm trước khi xử lý tệp tải lên.");
      return;
    }

    showActionToast(
      "Đang khởi tạo quy trình xử lý AI. Vui lòng giữ nguyên trạng thái trình duyệt và không thao tác các nút khác để đảm bảo Pipeline hoạt động chính xác.",
      "info",
      15000,
    );
    startProcessing({
      source: "upload",
      fileName: selectedFileName,
      durationSecond:
        selectedFileDurationSecond ?? (activeMeeting.durationSecond || 240),
      sourceAudioFile: selectedFile,
    });
  }

  function handleProcessRecording() {
    if (recordingSecond === 0 || !recordingPreviewUrl || !recordingFile) {
      setNotice("Bản thu quá ngắn. Vui lòng thu âm lại ít nhất vài giây.");
      return;
    }

    showActionToast(
      "Đang khởi tạo quy trình xử lý AI. Vui lòng giữ nguyên trạng thái trình duyệt và không thao tác các nút khác để đảm bảo Pipeline hoạt động chính xác.",
      "info",
      15000,
    );
    startProcessing({
      source: "recording",
      fileName: activeMeeting.fileName,
      durationSecond: recordingSecond,
      sourceAudioFile: recordingFile,
    });
  }

  function handleOpenMinutesEditor() {
    setMinutesDraft(activeMeeting.minutes);
    setMinutesValidationError(null);
    setIsMinutesDialogOpen(true);
  }

  function handleSaveMinutesDraft() {
    if (isSavingMinutes) {
      return;
    }

    const parsed = minutesDraftSchema.safeParse(minutesDraft);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message;
      setMinutesValidationError(message ?? "Biên bản không hợp lệ.");
      return;
    }

    const apiRecordId = activeMeeting.apiRecordId;

    if (!apiRecordId) {
      setMinutesValidationError("Không có ID phiên họp để lưu biên bản.");
      return;
    }

    setMinutesValidationError(null);
    setNotice("Đang lưu biên bản...");
    setIsSavingMinutes(true);

    void (async () => {
      try {
        const result = await updateReportMutation.mutateAsync({
          id: apiRecordId,
          textContent: parsed.data,
        });

        setActiveMeeting((prev) => ({
          ...prev,
          minutes: parsed.data,
          reportUrl: result.reportUrl,
        }));
        setMinutesDraft(parsed.data);
        setIsMinutesDialogOpen(false);
        setNotice("Đã lưu biên bản thành công. Vui lòng gửi email để chia sẻ.");
        showActionToast("Đã lưu biên bản thành công.");
        setIsEmailDialogOpen(true);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Lỗi không xác định";
        setMinutesValidationError(`Lỗi khi lưu biên bản: ${message}`);
        setNotice(`Lỗi lưu biên bản: ${message}`);
      } finally {
        setIsSavingMinutes(false);
      }
    })();
  }

  function handleSendEmail(
    recipients: string[],
    template: MeetingMailTemplate,
  ) {
    if (!canSendEmail || isSendingEmail) {
      if (!activeMeeting.reportUrl?.trim()) {
        setNotice("Vui lòng xem, chỉnh sửa và lưu biên bản để gửi email.");
      }
      return;
    }

    setIsSendingEmail(true);
    setNotice("Đang gửi email biên bản...");

    void (async () => {
      try {
        const sendResult = await sendMail({
          emails: recipients,
          momFileUrl: activeMeeting.reportUrl ?? "",
          template,
        });

        const failedRecipients = new Set(
          sendResult.results
            .filter((item) => item.status !== "sent")
            .map((item) => item.email.toLowerCase()),
        );
        const shouldMarkAllFailed =
          sendResult.failed > 0 && sendResult.results.length === 0;

        setActiveMeeting((prev) => ({
          ...prev,
          emailStatus: sendResult.failed > 0 ? "failed" : "sent",
          emailLogs: [
            ...recipients.map((recipient, index) => {
              const failed =
                shouldMarkAllFailed ||
                failedRecipients.has(recipient.trim().toLowerCase());

              return {
                id: `email-${recipient}-${Date.now()}-${index}`,
                recipient,
                sentAt: new Date().toISOString(),
                status: failed ? ("failed" as const) : ("sent" as const),
              };
            }),
            ...prev.emailLogs,
          ],
          mailTemplate: template,
        }));

        setIsEmailDialogOpen(sendResult.failed > 0);

        if (sendResult.failed > 0) {
          setNotice(
            `Gửi email hoàn tất với ${sendResult.sent}/${sendResult.total} thành công.`,
          );
          showActionToast(
            `Đã gửi ${sendResult.sent}/${sendResult.total} email, còn ${sendResult.failed} lỗi.`,
          );
          return;
        }

        setNotice("Đã gửi email thành công.");
        showActionToast("Đã gửi email thành công.");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        setActiveMeeting((prev) => ({
          ...prev,
          emailStatus: "failed",
          emailLogs: [
            ...recipients.map((recipient, index) => ({
              id: `email-failed-${recipient}-${Date.now()}-${index}`,
              recipient,
              sentAt: new Date().toISOString(),
              status: "failed" as const,
            })),
            ...prev.emailLogs,
          ],
          mailTemplate: template,
        }));
        setNotice(`Gửi email thất bại: ${errorMessage}`);
        showActionToast(`Gửi email thất bại: ${errorMessage}`);
      } finally {
        setIsSendingEmail(false);
      }
    })();
  }

  function handleSubmitSendEmail() {
    const parsed = recipientEmailsSchema.safeParse(emailRecipientsInput);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message;
      setEmailValidationError(message ?? "Danh sách email không hợp lệ.");
      return;
    }

    const subject = emailSubjectInput.trim();
    const body = emailBodyInput.trim();

    if (!subject) {
      setEmailTemplateValidationError("Vui lòng nhập tiêu đề email.");
      return;
    }

    if (!body) {
      setEmailTemplateValidationError("Vui lòng nhập nội dung email.");
      return;
    }

    setEmailValidationError(null);
    setEmailTemplateValidationError(null);
    handleSendEmail(parsed.data, {
      subject,
      body,
      isHtml: emailIsHtml,
    });
  }

  function handleEmailDialogOpenChange(nextOpen: boolean) {
    if (nextOpen && !canSendEmail) {
      setNotice("Vui lòng xem, chỉnh sửa và lưu biên bản để gửi email.");
      return;
    }

    setIsEmailDialogOpen(nextOpen);
    if (nextOpen) {
      setEmailValidationError(null);
      setEmailTemplateValidationError(null);
    }
  }

  function handleEmailRecipientsInputChange(value: string) {
    setEmailRecipientsInput(value);
    if (emailValidationError) {
      setEmailValidationError(null);
    }
  }

  function handleEmailSubjectInputChange(value: string) {
    setEmailSubjectInput(value);
    if (emailTemplateValidationError) {
      setEmailTemplateValidationError(null);
    }
  }

  function handleEmailBodyInputChange(value: string) {
    setEmailBodyInput(value);
    if (emailTemplateValidationError) {
      setEmailTemplateValidationError(null);
    }
  }

  function handleEmailIsHtmlChange(nextValue: boolean) {
    setEmailIsHtml(nextValue);
  }

  function handleMinutesDialogOpenChange(nextOpen: boolean) {
    if (isSavingMinutes) {
      return;
    }

    setIsMinutesDialogOpen(nextOpen);
    if (nextOpen) {
      setMinutesDraft(activeMeeting.minutes);
      setMinutesValidationError(null);
    }
  }

  function handleMinutesDraftChange(value: string) {
    setMinutesDraft(value);
    if (minutesValidationError) {
      setMinutesValidationError(null);
    }
  }

  return (
    <div className="grid flex-1 gap-4 lg:h-[calc(100dvh-7.5rem)] lg:grid-cols-[1fr_1.8fr] lg:items-start">
      <section className="rounded-lg border border-border/80 bg-card p-5 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100dvh-8.5rem)] lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-foreground">
            Hệ thống báo cáo biên bản cuộc họp
          </h1>
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Tải file cuộc họp hoặc ghi âm trực tiếp để bắt đầu dịch băng và tổng
          hợp nội dung.
        </p>

        <div className="mt-4 inline-flex rounded-lg border border-border/70 bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => handleSwitchMode("upload")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              inputMode === "upload"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            disabled={busyProcessing}
          >
            Tải tệp
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode("recording")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              inputMode === "recording"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            disabled={busyProcessing}
          >
            Thu âm trực tiếp
          </button>
        </div>

        {inputMode === "upload" ? (
          <UploadPanel
            busyProcessing={busyProcessing}
            isDraggingUpload={isDraggingUpload}
            fileInputRef={fileInputRef}
            selectedFile={selectedFile}
            selectedFileName={selectedFileName}
            selectedFileSizeLabel={selectedFileSizeLabel}
            selectedFileDurationLabel={selectedFileDurationLabel}
            filePreviewUrl={filePreviewUrl}
            uploadWarning={uploadWarning}
            onDragEnter={handleUploadDragEnter}
            onDragOver={handleUploadDragOver}
            onDragLeave={handleUploadDragLeave}
            onDrop={handleUploadDrop}
            onFileChange={handleFileChange}
            onProcessSelectedFile={handleProcessSelectedFile}
            onClearSelectedFile={handleClearSelectedFile}
          />
        ) : (
          <RecordingPanel
            busyProcessing={busyProcessing}
            isRecording={isRecording}
            recordingSecond={recordingSecond}
            recordingPreviewUrl={recordingPreviewUrl}
            recordingDurationLabel={recordingDurationLabel}
            onToggleRecording={handleToggleRecording}
            onProcessRecording={handleProcessRecording}
            onClearRecording={handleClearRecording}
          />
        )}

        {shouldShowPipeline ? (
          <PipelineProgressCard
            stageProgress={stageProgress}
            pipelineSteps={pipelineSteps}
            canRetryPipeline={canRetryPipeline}
            failedStepId={failedStepId}
            onRetryPipeline={handleRetryPipeline}
          />
        ) : null}

        <Separator className="my-5" />

        <SessionInfoCard
          activeMeeting={activeMeeting}
          isRecording={isRecording}
          recordingElapsedMs={recordingElapsedMs}
        />
      </section>

      <section className="rounded-lg border border-border/80 bg-card p-5 shadow-sm lg:flex lg:max-h-[calc(100dvh-8.5rem)] lg:flex-col lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Kết quả xử lý
          </h2>
          <div className="flex flex-wrap gap-2">
            {/* <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleGenerateMinutes}
              disabled={activeMeeting.processingStatus !== "completed"}
            >
              <SparklesIcon className="size-4" />
              Tinh chỉnh biên bản
            </Button> */}
            {/* <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshSpeakerSummary}
              disabled={activeMeeting.processingStatus !== "completed"}
            >
              Tóm tắt theo người nói
            </Button> */}
            <SpeakersLabelingDialog
              activeMeeting={activeMeeting}
              onUpdateMeeting={setActiveMeeting}
              setNotice={setNotice}
              showActionToast={showActionToast}
            />
            <EmailDialog
              open={isEmailDialogOpen}
              onOpenChange={handleEmailDialogOpenChange}
              canSendEmail={canSendEmail}
              isSendingEmail={isSendingEmail}
              reportUrl={activeMeeting.reportUrl}
              emailSubjectInput={emailSubjectInput}
              emailBodyInput={emailBodyInput}
              emailIsHtml={emailIsHtml}
              emailRecipientsInput={emailRecipientsInput}
              emailTemplateValidationError={emailTemplateValidationError}
              onEmailRecipientsInputChange={handleEmailRecipientsInputChange}
              onEmailSubjectInputChange={handleEmailSubjectInputChange}
              onEmailBodyInputChange={handleEmailBodyInputChange}
              onEmailIsHtmlChange={handleEmailIsHtmlChange}
              emailValidationError={emailValidationError}
              onSubmitSendEmail={handleSubmitSendEmail}
            />
          </div>
        </div>

        <p className="mt-3 rounded-md border border-border/70 bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
          {notice}
        </p>

        {shouldShowMinutes ? (
          <MinutesEditorDialog
            open={isMinutesDialogOpen}
            onOpenChange={handleMinutesDialogOpenChange}
            onOpenEditor={handleOpenMinutesEditor}
            minutesMarkdown={activeMeeting.minutes}
            minutesDraft={minutesDraft}
            onMinutesDraftChange={handleMinutesDraftChange}
            minutesValidationError={minutesValidationError}
            isSavingMinutes={isSavingMinutes}
            onSaveMinutesDraft={handleSaveMinutesDraft}
            reportUrl={activeMeeting.reportUrl}
          />
        ) : null}

        {shouldShowRawTranscript ? (
          <TranscriptComparisonDialog
            rawTranscript={reformatTranscriptTimestamps(activeMeeting.rawTranscript)}
            refinedTranscript={reformatTranscriptTimestamps(
              activeMeeting.refinedTranscript ?? "",
            )}
            shouldShowRefinedTranscript={shouldShowRefinedTranscript}
            onCopyRawTranscript={handleCopyRawTranscript}
            onCopyRefinedTranscript={handleCopyRefinedTranscript}
          />
        ) : null}

        {shouldShowDiarization || shouldShowSpeakerSummary ? (
          <div className="mt-4 space-y-4">
            {shouldShowDiarization ? (
              <article className="rounded-lg border border-border/70 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Transcript theo người nói
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="rounded-full border border-border/70 bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {activeMeeting.speakerCount} speaker
                    </span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Mở toàn màn hình transcript theo người nói"
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
                              Transcript theo người nói
                            </DialogTitle>
                            <DialogDescription className="px-6 pb-3 text-xs">
                              Xem đầy đủ để đối sánh nội dung theo từng người
                              nói.
                            </DialogDescription>
                          </DialogHeader>

                          <div
                            className={`grid gap-4 px-6 pb-6 ${shouldShowRefinedDiarization
                              ? "md:grid-cols-1"
                              : "grid-cols-1"
                              }`}
                          >
                            {/* <section className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Bản gốc theo người nói
                              </p>
                              <ul className="space-y-2 overflow-auto pr-1 md:max-h-[55dvh]">
                                {activeMeeting.segments.map((segment) => (
                                  <li
                                    key={`dialog-${segment.id}`}
                                    className={`rounded-md border border-border/60 border-l-4 p-3 text-sm ${speakerToneClass(segment.speaker)}`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-xs font-semibold text-foreground">
                                        {segment.speaker}
                                      </span>
                                      <span className="text-[11px] font-medium text-muted-foreground">
                                        {formatTimelineSecond(
                                          segment.startSecond,
                                        )}{" "}
                                        -{" "}
                                        {formatTimelineSecond(
                                          segment.endSecond,
                                        )}
                                      </span>
                                    </div>
                                    <p className="mt-2 leading-6 text-muted-foreground">
                                      {segment.text}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            </section> */}

                            {shouldShowRefinedDiarization ? (
                              <section className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Bản đã làm sạch theo người nói
                                </p>
                                <ul className="space-y-2 overflow-auto pr-1 md:max-h-[55dvh]">
                                  {refinedSegments.map((segment) => (
                                    <li
                                      key={`dialog-refined-${segment.id}`}
                                      className={`rounded-md border border-border/60 border-l-4 p-3 text-sm ${speakerToneClass(segment.speaker)}`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-xs font-semibold text-foreground">
                                          {segment.speaker}
                                        </span>
                                        <span className="text-[11px] font-medium text-muted-foreground">
                                          {formatTimelineSecond(
                                            segment.startSecond,
                                          )}{" "}
                                          -{" "}
                                          {formatTimelineSecond(
                                            segment.endSecond,
                                          )}
                                        </span>
                                      </div>
                                      <p className="mt-2 leading-6 text-muted-foreground">
                                        {segment.text}
                                      </p>
                                    </li>
                                  ))}
                                </ul>
                              </section>
                            ) : null}
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
                <div
                  className={`mt-3 grid gap-3 ${shouldShowRefinedDiarization
                    ? "md:grid-cols-1"
                    : "grid-cols-1"
                    }`}
                >
                  {/* <section className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Bản gốc theo người nói
                    </p>
                    <ul className="space-y-2 overflow-auto pr-1 xl:max-h-[52dvh]">
                      {activeMeeting.segments.map((segment) => (
                        <li
                          key={segment.id}
                          className={`rounded-md border border-border/60 border-l-4 p-3 text-sm ${speakerToneClass(segment.speaker)}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-xs font-semibold text-foreground">
                              {segment.speaker}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {formatTimelineSecond(segment.startSecond)} -{" "}
                              {formatTimelineSecond(segment.endSecond)}
                            </span>
                          </div>
                          <p className="mt-2 leading-6 text-muted-foreground">
                            {segment.text}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section> */}

                  {shouldShowRefinedDiarization ? (
                    <section className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Bản đã làm sạch theo người nói
                      </p>
                      <ul className="space-y-2 overflow-auto pr-1 xl:max-h-[52dvh]">
                        {refinedSegments.map((segment) => (
                          <li
                            key={`refined-${segment.id}`}
                            className={`rounded-md border border-border/60 border-l-4 p-3 text-sm ${speakerToneClass(segment.speaker)}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-xs font-semibold text-foreground">
                                {segment.speaker}
                              </span>
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {formatTimelineSecond(segment.startSecond)} -{" "}
                                {formatTimelineSecond(segment.endSecond)}
                              </span>
                            </div>
                            <p className="mt-2 leading-6 text-muted-foreground">
                              {segment.text}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              </article>
            ) : null}

            {shouldShowSpeakerSummary ? (
              <article className="rounded-lg border border-border/70 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">
                  Tóm tắt theo người nói
                </h3>
                <ul className="mt-3 space-y-3 overflow-auto xl:max-h-[52dvh]">
                  {activeMeeting.speakerSummaries.map((summary) => (
                    <li
                      key={summary.speaker}
                      className="rounded-md border border-border/60 bg-secondary/30 p-3 text-sm"
                    >
                      <p className="font-semibold text-foreground">
                        {summary.speaker}
                      </p>
                      <ul className="mt-1 space-y-1 text-muted-foreground">
                        {summary.keyPoints.map((point) => (
                          <li key={point}>- {point}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </div>
        ) : null}
      </section>

      {actionToast ? (
        <div
          className={`fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-lg border px-3 py-2 text-xs font-medium shadow-lg backdrop-blur transition-all ${actionToast.variant === "success"
              ? "border-emerald-300/70 bg-emerald-50/95 text-emerald-900"
              : actionToast.variant === "error"
                ? "border-rose-300/70 bg-rose-50/95 text-rose-900"
                : "border-blue-300/70 bg-blue-50/95 text-blue-900"
            }`}
        >
          <span>{actionToast.message}</span>
          <button
            onClick={hideActionToast}
            className="group flex size-5 items-center justify-center rounded-full transition-colors hover:bg-black/10 active:bg-black/20"
            title="Đóng thông báo"
          >
            <XIcon className="size-3.5 transition-transform group-hover:scale-110" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
