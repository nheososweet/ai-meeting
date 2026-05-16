"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleIcon,
  Edit3Icon,
  FolderOpenIcon,
  Loader2Icon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailDialog } from "@/app/(main)/workspace/_components/EmailDialog";
import { MinutesEditorDialog } from "@/app/(main)/workspace/_components/MinutesEditorDialog";
import { PipelineProgressCard } from "@/app/(main)/workspace/_components/PipelineProgressCard";
import { TranscriptComparisonDialog } from "@/app/(main)/workspace/_components/TranscriptComparisonDialog";
import { TranslateDialog } from "@/app/(main)/meeting/_components/TranslateDialog";
import {
  formatTimestamp,
  statusConfig,
} from "@/app/(main)/workspace/_lib/format-utils";
import { SpeakersLabelingDialog } from "@/app/(main)/workspace/_components/SpeakersLabelingDialog";
import {
  cleanTranscriptLine,
  parseTranscriptSegments,
  buildSpeakerSummariesFromSegments,
} from "@/app/(main)/workspace/_lib/transcript-utils";
import {
  minutesDraftSchema,
  recipientEmailsSchema,
} from "@/app/(main)/workspace/_lib/validation";
import { useWorkspaceToast } from "@/app/(main)/workspace/_hooks/useWorkspaceToast";
import { useUpdateReportMutation } from "@/hooks/services/use-update-report-mutation";
import { useUpdateTranscribeMutation } from "@/hooks/services/use-update-transcribe-mutation";
import { sendMail } from "@/services/pipeline-records.service";
import type {
  AudioInputSource,
  MeetingMailTemplate,
  TranscriptSegment,
} from "@/lib/types/meeting";
import { useMeetingPipeline } from "@/hooks/use-meeting-pipeline";
import {
  buildDefaultMailTemplate,
  resolveMailTemplate,
  initialMeeting,
} from "@/app/(main)/meeting/_lib/initial-meeting";

import { TranscriptEditorDialog } from "./_components/TranscriptEditorDialog";
import { FileSelector } from "./_components/file-selector";
import { FileRecord } from "@/lib/types/files";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth/auth-context";

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
  const updateReportMutation = useUpdateReportMutation();
  const updateTranscribeMutation = useUpdateTranscribeMutation();

  const { hasPermission } = useAuth();
  const canSendMail = hasPermission("send_mail");
  const canTranslate = hasPermission("translate");

  const {
    activeMeeting,
    setActiveMeeting,
    pipelineSteps,
    failedStepId,
    notice,
    setNotice,
    minutesDraft,
    setMinutesDraft,
    busyProcessing,
    stageProgress,
    canRetryPipeline,
    startProcessing,
    retryPipeline,
    resetPipeline,
  } = useMeetingPipeline();

  const [inputMode, setInputMode] = useState<AudioInputSource>("assigned");
  const [selectedFileRecord, setSelectedFileRecord] = useState<FileRecord | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);

  const [emailRecipientsInput, setEmailRecipientsInput] = useState("");
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null);
  const [emailTemplateValidationError, setEmailTemplateValidationError] = useState<string | null>(null);
  const [emailSubjectInput, setEmailSubjectInput] = useState(buildDefaultMailTemplate("").subject);
  const [emailBodyInput, setEmailBodyInput] = useState(buildDefaultMailTemplate("").body);
  const [emailIsHtml, setEmailIsHtml] = useState(true);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isMinutesDialogOpen, setIsMinutesDialogOpen] = useState(false);
  const [isTranscriptEditorOpen, setIsTranscriptEditorOpen] = useState(false);
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);
  const [transcriptValidationError, setTranscriptValidationError] = useState<string | null>(null);
  const [minutesValidationError, setMinutesValidationError] = useState<string | null>(null);
  const [isSavingMinutes, setIsSavingMinutes] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const { showActionToast } = useWorkspaceToast();

  const status = statusConfig(activeMeeting.processingStatus);

  const shouldShowPipeline = activeMeeting.processingStatus !== "idle";
  const shouldShowMinutes = activeMeeting.minutes !== initialMeeting.minutes;
  const shouldShowRawTranscript = activeMeeting.rawTranscript !== initialMeeting.rawTranscript;
  const shouldShowRefinedTranscript =
    Boolean(activeMeeting.refinedTranscript?.trim()) &&
    activeMeeting.refinedTranscript !== initialMeeting.refinedTranscript;
  const canSendEmail =
    activeMeeting.processingStatus === "completed" &&
    Boolean(activeMeeting.reportUrl?.trim());
  const shouldShowDiarization = activeMeeting.segments.length > 0;
  const shouldShowSpeakerSummary = activeMeeting.speakerSummaries.length > 0;

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
              report: activeMeeting.reportUrl ? "success" : prev.fileStatus.report,
            },
          }
          : null,
      );
    }
  }, [activeMeeting.processingStatus, activeMeeting.reportUrl]);

  const refinedSegments = useMemo(() => {
    const refinedText = (activeMeeting.refinedTranscript ?? "").trim();
    if (!refinedText) return [] as TranscriptSegment[];
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
    const nextTemplate = resolveMailTemplate(activeMeeting.mailTemplate, activeMeeting.title);
    setEmailSubjectInput(nextTemplate.subject);
    setEmailBodyInput(nextTemplate.body);
    setEmailIsHtml(nextTemplate.isHtml);
  }, [activeMeeting.mailTemplate, activeMeeting.title]);

  function handleRetryPipeline() {
    retryPipeline({ selectedFile: null, recordingFile: null, recordingSecond: 0 });
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

  function playSegment(segmentId: string, start: number, end: number) {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingSegmentId === segmentId && !audio.paused) {
      audio.pause();
      setPlayingSegmentId(null);
      return;
    }

    audio.pause();
    audio.currentTime = start;
    setPlayingSegmentId(segmentId);

    audio.ontimeupdate = () => {
      if (audio.currentTime >= end) {
        audio.pause();
        audio.ontimeupdate = null;
        setPlayingSegmentId(null);
      }
    };

    void audio.play();
  }

  function handleProcessSelectedFile() {
    if (!selectedFileRecord) {
      setNotice("Vui lòng chọn tệp audio trước khi xử lý.");
      return;
    }

    showActionToast(
      "Đang khởi tạo quy trình xử lý AI. Bạn có thể chuyển sang trang khác — pipeline sẽ tiếp tục chạy ngầm.",
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

  async function handleSaveTranscript(content: string) {
    const apiRecordId = activeMeeting.apiRecordId;
    if (!apiRecordId) {
      setTranscriptValidationError("Không có ID phiên họp để cập nhật bản gỡ băng.");
      return;
    }

    setTranscriptValidationError(null);
    setIsSavingTranscript(true);

    try {
      await updateTranscribeMutation.mutateAsync({
        id: apiRecordId,
        textContent: content,
      });

      setActiveMeeting((prev) => {
        const newSegments = parseTranscriptSegments(content.split("\n"));
        const updatedSummaries = buildSpeakerSummariesFromSegments(
          newSegments,
          prev.speakerSummaries
        );

        return {
          ...prev,
          refinedTranscript: content,
          speakerSummaries: updatedSummaries,
          segments: newSegments,
          speakerCount: new Set(newSegments.map(s => s.speaker)).size,
        };
      });

      setIsTranscriptEditorOpen(false);
      showActionToast("Đã lưu bản gỡ băng thành công.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lỗi không xác định";
      setTranscriptValidationError(`Lỗi khi lưu bản gỡ băng: ${message}`);
    } finally {
      setIsSavingTranscript(false);
    }
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
        showActionToast(sendResult.failed > 0
          ? `Đã gửi ${sendResult.sent}/${sendResult.total} email, còn ${sendResult.failed} lỗi.`
          : "Đã gửi email thành công.");
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
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h1 className="text-base font-bold text-foreground">Trình biên tập phiên họp</h1>
                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", status.className)}>
                      {status.label}
                    </span>
                  </div>
                  {shouldShowPipeline ? (
                    <p className="text-sm font-medium text-muted-foreground line-clamp-1">
                      <span className="font-medium text-foreground/80">{activeMeeting.fileName}</span>
                      {busyProcessing && <span className="ml-1.5 text-primary/70">— đang xử lý...</span>}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground line-clamp-1">
                      Tải lên hoặc chọn tệp âm thanh để hệ thống tự động gỡ băng và tạo biên bản.
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {isInputOpen ? <ChevronUpIcon className="size-5 text-muted-foreground" /> : <ChevronDownIcon className="size-5 text-muted-foreground" />}
                </div>
              </div>
            </CollapsibleTrigger>

            {!isInputOpen && shouldShowPipeline && (
              <div className="border-t border-border/60 px-4 pb-3 pt-2 md:px-5 md:pb-4 md:pt-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-xs text-muted-foreground truncate">{notice}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {!busyProcessing && (
                      <button
                        onClick={(e) => { e.stopPropagation(); resetPipeline(); setIsInputOpen(true); }}
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      >
                        <RotateCcwIcon className="size-3" /> Phiên mới
                      </button>
                    )}
                    <span className="text-xs font-bold text-primary">{stageProgress}%</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${stageProgress}%` }} />
                </div>
              </div>
            )}

            <CollapsibleContent forceMount className={cn("border-t border-border/60", !isInputOpen && "hidden")}>
              <div className="p-4 md:p-6 lg:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {shouldShowPipeline && !busyProcessing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetPipeline}
                          className="h-8 rounded-full px-4 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                          <RotateCcwIcon className="size-3.5" /> Phiên mới
                        </Button>
                      )}
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-border/60 px-4 py-2 bg-muted/10 gap-2 overflow-hidden">
              <div className="w-full overflow-x-auto pb-1 -mb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <TabsList className="h-9 bg-transparent p-0 gap-1 w-max">
                  {availableTabs.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id} className="h-8 rounded-md px-3 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {activeTab === "transcript" && shouldShowRawTranscript && (
                  <Button variant="ghost" size="sm" onClick={handleCopyRawTranscript} className="h-8 gap-1.5 text-xs font-semibold text-muted-foreground">Sao chép bản gốc</Button>
                )}
                {activeTab === "transcript" && shouldShowRefinedTranscript && (
                  <Button variant="ghost" size="sm" onClick={handleCopyRefinedTranscript} className="h-8 gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10">Sao chép bản làm sạch</Button>
                )}
                {activeTab === "transcript" && (shouldShowRawTranscript || shouldShowRefinedTranscript) && (
                  <Button variant="ghost" size="sm" onClick={() => setIsTranscriptEditorOpen(true)} className="h-8 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10">
                    <Edit3Icon className="size-3.5" /> Chỉnh sửa
                  </Button>
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

            {activeMeeting.audioUrl && (
              <div className="border-b border-border/60 bg-muted/5 px-4 py-2 md:px-6">
                <audio
                  ref={audioRef}
                  src={activeMeeting.audioUrl}
                  controls
                  preload="metadata"
                  onPause={() => setPlayingSegmentId(null)}
                  onEnded={() => setPlayingSegmentId(null)}
                  className="h-10 w-full accent-primary"
                />
              </div>
            )}

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
                          audioUrl={activeMeeting.audioUrl}
                          onPlaySegment={playSegment}
                          playingSegmentId={playingSegmentId}
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
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">{formatTimestamp(segment.startSecond)} - {formatTimestamp(segment.endSecond)}</span>
                              {activeMeeting.audioUrl && (
                                <button
                                  onClick={() => playSegment(segment.id, segment.startSecond, segment.endSecond)}
                                  className="flex items-center justify-center rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-primary"
                                  title="Nghe đoạn này"
                                >
                                  {playingSegmentId === segment.id ? (
                                    <PauseIcon className="size-3.5" />
                                  ) : (
                                    <PlayIcon className="size-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-medium leading-relaxed text-foreground/90">{segment.text}</p>
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
                          <ul className="space-y-3">{s.keyPoints.map((point, j) => <li key={j} className="flex gap-3 text-sm font-medium text-foreground/80"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/40" />{point}</li>)}</ul>
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

        <TranscriptEditorDialog
          open={isTranscriptEditorOpen}
          onOpenChange={setIsTranscriptEditorOpen}
          rawTranscript={activeMeeting.refinedTranscript || activeMeeting.rawTranscript}
          isSaving={isSavingTranscript}
          onSave={handleSaveTranscript}
          error={transcriptValidationError}
        />
      </div>
    </>
  );
}
