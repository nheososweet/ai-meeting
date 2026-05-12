"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleDashedIcon,
  CircleIcon,
  FolderOpenIcon,
  Loader2Icon,
  Maximize2Icon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailDialog } from "@/app/(main)/workspace/_components/EmailDialog";
import { MinutesEditorDialog } from "@/app/(main)/workspace/_components/MinutesEditorDialog";
import { PipelineProgressCard } from "@/app/(main)/workspace/_components/PipelineProgressCard";
import { TranscriptComparisonDialog } from "@/app/(main)/workspace/_components/TranscriptComparisonDialog";
import { TranslateDialog } from "@/app/(main)/meeting/_components/TranslateDialog";
import {
  formatDuration,
  statusConfig,
} from "@/app/(main)/workspace/_lib/format-utils";
import { PIPELINE_STEP_WEIGHT } from "@/app/(main)/workspace/_lib/pipeline-constants";
import { SpeakersLabelingDialog } from "@/app/(main)/workspace/_components/SpeakersLabelingDialog";
import {
  cleanTranscriptLine,
  parseTranscriptSegments,
} from "@/app/(main)/workspace/_lib/transcript-utils";
import {
  minutesDraftSchema,
  recipientEmailsSchema,
} from "@/app/(main)/workspace/_lib/validation";
import { useWorkspacePipeline } from "@/app/(main)/workspace/_hooks/useWorkspacePipeline";
import { useWorkspaceToast } from "@/app/(main)/workspace/_hooks/useWorkspaceToast";
import { useDiarizeTranscribeByFileIdMutation } from "@/hooks/services/use-diarize-transcribe-by-file-id-mutation";
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

import { FileSelector } from "./_components/file-selector";
import { FileRecord } from "@/lib/types/files";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth/auth-context";

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
    "Bản gỡ băng sẽ hiển thị sau khi bạn chọn tệp và hoàn tất xử lý AI.",
  refinedTranscript:
    "Bản làm sạch sẽ hiển thị sau khi hệ thống xử lý xong bản gỡ băng gốc.",
  segments: [],
  minutes: "Biên bản điều hành sẽ được sinh sau khi xử lý hoàn tất.",
  speakerSummaries: [],
  emailLogs: [],
  durationSecond: 0,
  speakerCount: 0,
  mailTemplate: buildDefaultMailTemplate(""),
};

function TabEmptyState({ busyProcessing }: { busyProcessing: boolean }) {
  if (busyProcessing) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        <Loader2Icon className="mb-3 size-6 animate-spin text-primary/70" />
        <p>Đang xử lý kết quả AI. Vui lòng đợi...</p>
      </div>
    );
  }
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
      <FolderOpenIcon className="mb-3 size-8 text-muted-foreground/50" />
      <p>Chưa có dữ liệu. Vui lòng chọn tệp phù hợp để bắt đầu.</p>
    </div>
  );
}

export default function MeetingPage() {
  const diarizeTranscribeMutation = useDiarizeTranscribeMutation();
  const diarizeTranscribeByFileIdMutation = useDiarizeTranscribeByFileIdMutation();
  const summaryMinutesMutation = useSummaryMinutesMutation();
  const updateReportMutation = useUpdateReportMutation();

  const { hasPermission } = useAuth();
  const canSendMail = hasPermission("send_mail");
  const canTranslate = hasPermission("translate");

  const [inputMode, setInputMode] = useState<AudioInputSource>("assigned");
  const [selectedFileRecord, setSelectedFileRecord] = useState<FileRecord | null>(null);
  const [activeMeeting, setActiveMeeting] =
    useState<MeetingRecord>(initialMeeting);
  const [, setUploadProgress] = useState(0);
  const [, setProcessingProgress] = useState(0);
  const [notice, setNotice] = useState(
    "Sẵn sàng nhận tệp để bắt đầu xử lý.",
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

  const { actionToast, showActionToast } = useWorkspaceToast();

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
    diarizeTranscribeByFileIdMutation,
    summaryMinutesMutation,
    updateReportMutation,
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
  const recordingDurationLabel = "";

  // Sync selected file status after pipeline completes
  useEffect(() => {
    if (activeMeeting.processingStatus === "completed" && selectedFileRecord) {
      setSelectedFileRecord((prev) =>
        prev
          ? {
            ...prev,
            fileStatus: {
              ...prev.fileStatus,
              transcribe: "success",
              report: activeMeeting.reportUrl
                ? "success"
                : prev.fileStatus.report,
            },
          }
          : null,
      );
    }
  }, [activeMeeting.processingStatus, activeMeeting.reportUrl]);

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

  const availableTabs = [
    { id: "transcript", label: "Bản gỡ băng" },
    { id: "diarization", label: "Phân vai người nói" },
    { id: "summary", label: "Tóm tắt nội dung" },
    { id: "minutes", label: "Biên bản điều hành" },
  ];

  const [activeTab, setActiveTab] = useState<string>("transcript");
  const [isInputOpen, setIsInputOpen] = useState(true);

  useEffect(() => {
    if (busyProcessing) {
      setIsInputOpen(false);
    }
  }, [busyProcessing]);

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
      selectedFile: null,
      selectedFileName: activeMeeting.fileName,
      selectedFileDurationSecond: activeMeeting.durationSecond,
      recordingFile: null,
      recordingSecond: 0,
    });
  }

  async function handleCopyRawTranscript() {
    const transcript = activeMeeting.rawTranscript.trim();

    if (!transcript) {
      showActionToast("Chưa có bản gỡ băng để sao chép.");
      return;
    }

    try {
      await navigator.clipboard.writeText(transcript);
      showActionToast("Đã sao chép bản gỡ băng gốc.");
    } catch {
      showActionToast("Sao chép thất bại, vui lòng thử lại.");
    }
  }

  async function handleCopyRefinedTranscript() {
    const transcript = (activeMeeting.refinedTranscript ?? "").trim();

    if (!transcript) {
      showActionToast("Chưa có bản đã làm sạch để sao chép.");
      return;
    }

    try {
      await navigator.clipboard.writeText(transcript);
      showActionToast("Đã sao chép bản đã làm sạch.");
    } catch {
      showActionToast("Sao chép thất bại, vui lòng thử lại.");
    }
  }

  function handleSwitchMode(mode: AudioInputSource) {
    if (mode === inputMode) return;
    if (busyProcessing) {
      setNotice("Không thể đổi chế độ khi pipeline đang xử lý.");
      return;
    }

    setSelectedFileRecord(null);
    setInputMode(mode);
  }

  function handleProcessSelectedFile() {
    if (!selectedFileRecord) {
      setNotice("Vui lòng chọn tệp audio trước khi xử lý.");
      return;
    }

    showActionToast(
      "Đang khởi tạo quy trình xử lý AI. Vui lòng giữ nguyên trạng thái trình duyệt để đảm bảo Pipeline hoạt động chính xác.",
      "info",
      15000,
    );

    startProcessing({
      source: inputMode === "assigned" ? "assigned" : "self_upload",
      fileName: selectedFileRecord.title || selectedFileRecord.filename,
      durationSecond: 0,
      sourceAudioFile: null,
      fileId: selectedFileRecord.id,
    });
  }

  function handleOpenMinutesEditor() {
    setMinutesDraft(activeMeeting.minutes);
    setMinutesValidationError(null);
    setIsMinutesDialogOpen(true);
  }

  function handleSaveMinutesDraft() {
    if (isSavingMinutes) return;

    const parsed = minutesDraftSchema.safeParse(minutesDraft);
    if (!parsed.success) {
      setMinutesValidationError(parsed.error.issues[0]?.message ?? "Biên bản không hợp lệ.");
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
        const message = error instanceof Error ? error.message : "Lỗi không xác định";
        setMinutesValidationError(`Lỗi khi lưu biên bản: ${message}`);
        setNotice(`Lỗi lưu biên bản: ${message}`);
      } finally {
        setIsSavingMinutes(false);
      }
    })();
  }

  function handleSendEmail(recipients: string[], template: MeetingMailTemplate) {
    if (!canSendMail) {
      showActionToast("Bạn không có quyền gửi email biên bản.", "error");
      return;
    }
    if (!canSendEmail || isSendingEmail) return;

    setIsSendingEmail(true);
    setNotice("Đang gửi email biên bản...");

    void (async () => {
      try {
        const sendResult = await sendMail({
          emails: recipients,
          momFileUrl: activeMeeting.reportUrl ?? "",
          template,
          fileId: activeMeeting.apiRecordId,
        });

        const failedRecipients = new Set(
          sendResult.results
            .filter((item) => item.status !== "sent")
            .map((item) => item.email.toLowerCase()),
        );
        const shouldMarkAllFailed = sendResult.failed > 0 && sendResult.results.length === 0;

        setActiveMeeting((prev) => ({
          ...prev,
          emailStatus: sendResult.failed > 0 ? "failed" : "sent",
          emailLogs: [
            ...recipients.map((recipient, index) => {
              const failed = shouldMarkAllFailed || failedRecipients.has(recipient.trim().toLowerCase());
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
        showActionToast(sendResult.failed > 0 ? `Đã gửi ${sendResult.sent}/${sendResult.total} email, còn ${sendResult.failed} lỗi.` : "Đã gửi email thành công.");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
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
      setEmailValidationError(parsed.error.issues[0]?.message ?? "Danh sách email không hợp lệ.");
      return;
    }

    const subject = emailSubjectInput.trim();
    const body = emailBodyInput.trim();
    if (!subject || !body) {
      setEmailTemplateValidationError("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }

    setEmailValidationError(null);
    setEmailTemplateValidationError(null);
    handleSendEmail(parsed.data, { subject, body, isHtml: emailIsHtml });
  }

  function handleEmailDialogOpenChange(nextOpen: boolean) {
    if (nextOpen && !canSendMail) {
      showActionToast("Bạn không có quyền gửi email biên bản.", "error");
      return;
    }
    if (nextOpen && !canSendEmail) {
      setNotice("Vui lòng xem, chỉnh sửa và lưu biên bản để gửi email.");
      return;
    }
    setIsEmailDialogOpen(nextOpen);
  }

  function handleMinutesDialogOpenChange(nextOpen: boolean) {
    if (isSavingMinutes) return;
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
    <>
      <div className="flex flex-1 flex-col gap-4">
        <Collapsible open={isInputOpen} onOpenChange={setIsInputOpen}>
          <section className="rounded-lg border border-border/80 bg-card shadow-sm">
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30 md:px-5 md:py-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-base font-semibold text-foreground">Trình biên tập phiên họp</h1>
                  <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", status.className)}>
                    {status.label}
                  </span>
                </div>
                {isInputOpen ? <ChevronUpIcon className="size-5 text-muted-foreground" /> : <ChevronDownIcon className="size-5 text-muted-foreground" />}
              </div>
            </CollapsibleTrigger>

            {!isInputOpen && shouldShowPipeline && (
              <div className="border-t border-border/60 px-4 pb-3 pt-2 md:px-5 md:pb-4 md:pt-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${stageProgress}%` }} />
                  </div>
                  <span className="min-w-[40px] text-right text-xs font-bold text-primary">{stageProgress}%</span>
                </div>
                <p className="mt-2 text-xs font-medium text-muted-foreground">{notice}</p>
              </div>
            )}

            <CollapsibleContent forceMount className={cn("border-t border-border/60", !isInputOpen && "hidden")}>
              <div className="p-4 md:p-6 lg:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={inputMode === "assigned" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSwitchMode("assigned")}
                        className="h-8 rounded-full px-4 text-xs font-semibold"
                      >
                        Chọn tệp đã giao
                      </Button>
                      <Button
                        variant={inputMode === "self_upload" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSwitchMode("self_upload")}
                        className="h-8 rounded-full px-4 text-xs font-semibold"
                      >
                        Tệp đã tải lên
                      </Button>
                    </div>

                    <div className="min-h-[400px]">
                      <FileSelector
                        selectedFileRecord={selectedFileRecord}
                        onFileSelect={setSelectedFileRecord}
                        onProcessFile={handleProcessSelectedFile}
                        busyProcessing={busyProcessing}
                        assigned_filter={inputMode === "assigned"}
                        self_upload={inputMode === "self_upload"}
                      />
                    </div>
                  </div>

                  <div className="w-full shrink-0 lg:w-80">
                    <PipelineProgressCard
                      stageProgress={stageProgress}
                      pipelineSteps={pipelineSteps}
                      canRetryPipeline={canRetryPipeline}
                      failedStepId={failedStepId}
                      onRetryPipeline={handleRetryPipeline}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </section>
        </Collapsible>

        <section className="flex-1 overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 bg-muted/10">
              <TabsList className="h-9 bg-transparent p-0 gap-1">
                {availableTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="h-8 rounded-md px-3 text-xs font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex items-center gap-2">
                {activeTab === "transcript" && shouldShowRawTranscript && (
                  <Button variant="ghost" size="sm" onClick={handleCopyRawTranscript} className="h-8 gap-1.5 text-[11px] font-semibold text-muted-foreground">Sao chép bản gốc</Button>
                )}
                {activeTab === "transcript" && shouldShowRefinedTranscript && (
                  <Button variant="ghost" size="sm" onClick={handleCopyRefinedTranscript} className="h-8 gap-1.5 text-[11px] font-semibold text-primary">Sao chép bản làm sạch</Button>
                )}
                {activeTab === "transcript" && canTranslate && (shouldShowRawTranscript || shouldShowRefinedTranscript) && (
                  <TranslateDialog 
                    initialText={activeMeeting.refinedTranscript || activeMeeting.rawTranscript} 
                  />
                )}
                {activeTab === "diarization" && shouldShowRefinedDiarization && (
                  <SpeakersLabelingDialog
                    activeMeeting={activeMeeting}
                    onUpdateMeeting={setActiveMeeting}
                    setNotice={setNotice}
                    showActionToast={showActionToast}
                  />
                )}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 md:p-6 lg:p-8">
                <TabsContent value="transcript" className="mt-0 outline-none">
                  {!shouldShowRawTranscript ? (
                    <TabEmptyState busyProcessing={busyProcessing} />
                  ) : (
                    <article className="mx-auto max-w-4xl space-y-4">
                      {shouldShowRawTranscript && shouldShowRefinedTranscript ? (
                        <TranscriptComparisonDialog
                          rawTranscript={activeMeeting.rawTranscript}
                          refinedTranscript={activeMeeting.refinedTranscript ?? ""}
                          shouldShowRefinedTranscript={shouldShowRefinedTranscript}
                          onCopyRawTranscript={handleCopyRawTranscript}
                          onCopyRefinedTranscript={handleCopyRefinedTranscript}
                        />
                      ) : (
                        <div className="rounded-lg border border-border/70 bg-white p-6 shadow-sm">
                          {shouldShowRefinedTranscript ? (
                            <div className="space-y-6 animate-in fade-in duration-700">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                                <CheckCircle2Icon className="size-4" /> Bản đã làm sạch
                              </div>
                              <div className="prose prose-sm max-w-none text-foreground/90">
                                {activeMeeting.refinedTranscript?.split("\n").map((line, i) => (
                                  <p key={i} className="mb-4">{line}</p>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <CircleIcon className="size-4" /> Bản gỡ băng gốc
                              </div>
                              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground/80">
                                {activeMeeting.rawTranscript}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  )}
                </TabsContent>

                <TabsContent value="diarization" className="mt-0 outline-none">
                  {!shouldShowDiarization ? <TabEmptyState busyProcessing={busyProcessing} /> : (
                    <div className="mx-auto max-w-3xl space-y-6">
                      {(shouldShowRefinedDiarization ? refinedSegments : activeMeeting.segments).map((segment, i) => (
                        <div key={i} className={cn("group relative flex flex-col gap-2 rounded-xl border-l-4 p-4 transition-all hover:shadow-md", speakerToneClass(segment.speaker))}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-foreground">{segment.speaker}</span>
                            <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{segment.startSecond}s - {segment.endSecond}s</span>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground/90">{segment.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="summary" className="mt-0 outline-none">
                  {!shouldShowSpeakerSummary ? <TabEmptyState busyProcessing={busyProcessing} /> : (
                    <div className="mx-auto max-w-4xl grid gap-6 sm:grid-cols-2">
                      {activeMeeting.speakerSummaries.map((s, i) => (
                        <div key={i} className="rounded-xl border border-border/80 bg-muted/20 p-5 transition-all">
                          <div className="mb-4 flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">{s.speaker}</h4>
                          </div>
                          <ul className="space-y-3">{s.keyPoints.map((point, j) => <li key={j} className="flex gap-3 text-sm text-foreground/80"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/40" />{point}</li>)}</ul>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="minutes" className="mt-0 outline-none">
                  {!shouldShowMinutes ? (
                    <TabEmptyState busyProcessing={busyProcessing} />
                  ) : (
                    <article className="mx-auto max-w-4xl space-y-4">
                      <div className="flex justify-end gap-2">
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
                          onEmailRecipientsInputChange={setEmailRecipientsInput}
                          onEmailSubjectInputChange={setEmailSubjectInput}
                          onEmailBodyInputChange={setEmailBodyInput}
                          onEmailIsHtmlChange={setEmailIsHtml}
                          emailValidationError={emailValidationError}
                          onSubmitSendEmail={handleSubmitSendEmail}
                        />
                      </div>
                      <MinutesEditorDialog
                        open={isMinutesDialogOpen}
                        onOpenChange={handleMinutesDialogOpenChange}
                        onOpenEditor={handleOpenMinutesEditor}
                        minutesMarkdown={activeMeeting.minutes}
                        minutesDraft={minutesDraft}
                        onMinutesDraftChange={handleMinutesDraftChange}
                        onSaveMinutesDraft={handleSaveMinutesDraft}
                        isSavingMinutes={isSavingMinutes}
                        minutesValidationError={minutesValidationError}
                        reportUrl={activeMeeting.reportUrl}
                      />
                    </article>
                  )}
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </section>


      </div>
    </>
  );
}
