"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  diarizeAndTranscribe,
  diarizeAndTranscribeByFileId,
  generateSummaryAndMinutes,
  updateReport,
} from "@/services/pipeline-records.service";
import {
  createInitialPipelineSteps,
  PIPELINE_STEP_WEIGHT,
  type PipelineStep,
  type PipelineStepId,
} from "@/app/(main)/workspace/_lib/pipeline-constants";
import {
  buildSpeakerSummariesFromSegments,
  cleanTranscriptLine,
  deriveSpeakerCount,
  parseTranscriptSegments,
} from "@/app/(main)/workspace/_lib/transcript-utils";
import { meetingRecords } from "@/lib/mock/meetings";
import { initialMeeting } from "@/app/(main)/meeting/_lib/initial-meeting";
import { useBackgroundTask } from "@/hooks/use-background-task";
import type { MeetingPipelineSteps, PipelineStepStatus as BubbleStepStatus } from "@/lib/types/background-tasks";
import type { AudioInputSource, MeetingRecord, TranscriptSegment } from "@/lib/types/meeting";

const sourceMeeting = meetingRecords[0];

// ─── Types ────────────────────────────────────────────────────────────────────

export type StartProcessingArgs = {
  source: AudioInputSource | "file_select";
  fileName: string;
  durationSecond: number;
  sourceAudioFile: File | null;
  fileId?: number;
};

export type RetryPipelineArgs = {
  selectedFile: File | null;
  recordingFile: File | null;
  recordingSecond: number;
};

export interface MeetingPipelineContextValue {
  activeMeeting: MeetingRecord;
  setActiveMeeting: React.Dispatch<React.SetStateAction<MeetingRecord>>;
  pipelineSteps: PipelineStep[];
  failedStepId: PipelineStepId | null;
  notice: string;
  setNotice: (v: string) => void;
  minutesDraft: string;
  setMinutesDraft: (v: string) => void;
  busyProcessing: boolean;
  stageProgress: number;
  canRetryPipeline: boolean;
  startProcessing: (args: StartProcessingArgs) => void;
  retryPipeline: (args: RetryPipelineArgs) => void;
  resetPipeline: () => void;
}

export const MeetingPipelineContext = createContext<MeetingPipelineContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map pipeline-constants status → bubble status */
function toBubbleStatus(s: PipelineStep["status"]): BubbleStepStatus {
  return s === "running" ? "processing" : s === "completed" ? "success" : s === "error" ? "failed" : "waiting";
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MeetingPipelineProvider({ children }: { children: React.ReactNode }) {
  const [activeMeeting, setActiveMeeting] = useState<MeetingRecord>(initialMeeting);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(createInitialPipelineSteps);
  const [failedStepId, setFailedStepId] = useState<PipelineStepId | null>(null);
  const [notice, setNotice] = useState("Sẵn sàng nhận tệp để bắt đầu xử lý.");
  const [minutesDraft, setMinutesDraft] = useState(initialMeeting.minutes);

  const processingRunIdRef = useRef(0);
  const timerMapRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const taskIdRef = useRef<string | null>(null);

  const { addTask, updateTask, removeTask, scheduleAutoDismiss } = useBackgroundTask();
  const queryClient = useQueryClient();

  // ─── Timer helpers ──────────────────────────────────────────────────────────

  const clearTimerByKey = useCallback((key: string) => {
    const t = timerMapRef.current.get(key);
    if (t) { clearInterval(t); timerMapRef.current.delete(key); }
  }, []);

  const clearAllTimers = useCallback(() => {
    timerMapRef.current.forEach(clearInterval);
    timerMapRef.current.clear();
  }, []);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  // ─── Pipeline step helpers ──────────────────────────────────────────────────

  const updatePipelineStep = useCallback((
    stepId: PipelineStepId,
    updater: (step: PipelineStep) => PipelineStep,
  ) => {
    setPipelineSteps(prev => prev.map(s => s.id === stepId ? updater(s) : s));
  }, []);

  const markPipelineAsError = useCallback((message: string, failedStep?: PipelineStepId) => {
    if (failedStep) {
      setFailedStepId(failedStep);
      setPipelineSteps(prev => prev.map(s => s.id === failedStep ? { ...s, status: "error" } : s));
    } else {
      setFailedStepId(null);
    }
    setActiveMeeting(prev => ({ ...prev, processingStatus: "error" }));
    setNotice(message);
  }, []);

  // ─── Bubble step snapshot ───────────────────────────────────────────────────

  const buildBubbleSteps = useCallback((steps: PipelineStep[]): MeetingPipelineSteps => ({
    raw_transcript:  toBubbleStatus(steps.find(s => s.id === "raw_transcript")?.status  ?? "pending"),
    diarization:     toBubbleStatus(steps.find(s => s.id === "diarization")?.status     ?? "pending"),
    speaker_summary: toBubbleStatus(steps.find(s => s.id === "speaker_summary")?.status ?? "pending"),
    minutes:         toBubbleStatus(steps.find(s => s.id === "minutes")?.status         ?? "pending"),
  }), []);

  // ─── startProcessing ────────────────────────────────────────────────────────

  const startProcessing = useCallback(({
    source, fileName, durationSecond, sourceAudioFile, fileId,
  }: StartProcessingArgs) => {
    if (!fileName && !fileId) {
      markPipelineAsError("Không tìm thấy đầu vào hợp lệ cho quy trình.", "raw_transcript");
      return;
    }
    if (!sourceAudioFile && !fileId) {
      markPipelineAsError(
        source === "upload"
          ? "Không tìm thấy tệp tải lên để gọi API dịch băng."
          : "Không tìm thấy bản thu để gọi API dịch băng.",
        "raw_transcript",
      );
      return;
    }

    const runId = ++processingRunIdRef.current;
    clearAllTimers();

    const initialSteps = createInitialPipelineSteps();
    setPipelineSteps(initialSteps);
    setFailedStepId(null);

    setActiveMeeting(prev => ({
      ...prev,
      title: source === "assigned"   ? `Xử lý tệp được gán: ${fileName}`
           : source === "self_upload" ? `Xử lý tệp tự tải: ${fileName}`
           : source === "file_select" ? `Xử lý tệp: ${fileName}`
           : source === "upload"      ? `Phiên xử lý ${fileName}`
           : "Phiên xử lý bản thu trực tiếp",
      fileName,
      inputSource: source === "file_select" ? "assigned" : source as AudioInputSource,
      processingStatus: "processing",
      emailStatus: "not_sent",
      segments: [], speakerSummaries: [],
      minutes: "Biên bản điều hành đang được tạo...",
      rawTranscript: "Bản gỡ băng gốc đang được tạo từ âm thanh...",
      refinedTranscript: "Bản làm sạch đang được chuẩn bị...",
      speakerCount: 0, mailTemplate: undefined,
    }));
    setNotice("Bắt đầu chạy từng bước xử lý...");

    // Register task in bubble
    const taskId = `meeting-pipeline-${Date.now()}`;
    taskIdRef.current = taskId;
    addTask({
      id: taskId,
      type: "meeting_pipeline",
      label: `Xử lý: ${fileName}`,
      status: "running",
      progress: 0,
      steps: { raw_transcript: "processing", diarization: "waiting", speaker_summary: "waiting", minutes: "waiting" },
      createdAt: Date.now(),
    });

    // ── STEP 1: raw_transcript ──────────────────────────────────────────────
    setNotice("Đang chuyển tệp âm thanh thành văn bản...");
    updatePipelineStep("raw_transcript", s => ({ ...s, status: "running", progress: 8 }));

    let rawProgress = 8;
    const rawTimer = setInterval(() => {
      if (processingRunIdRef.current !== runId) { clearInterval(rawTimer); return; }
      rawProgress = Math.min(rawProgress + 9, 92);
      updatePipelineStep("raw_transcript", s => ({ ...s, progress: rawProgress }));
    }, 240);
    timerMapRef.current.set("raw", rawTimer);

    void (async () => {
      try {
        const apiResult = fileId
          ? await diarizeAndTranscribeByFileId({ fileId, language: "Vietnamese" })
          : await diarizeAndTranscribe({ file: sourceAudioFile!, language: "Vietnamese" });

        if (processingRunIdRef.current !== runId) return;

        const transcriptLines = apiResult.rawTranscription.map(cleanTranscriptLine).filter(Boolean);
        const refinedLines    = apiResult.refinedTranscription.map(cleanTranscriptLine).filter(Boolean);
        const parsedSegments  = parseTranscriptSegments(refinedLines);
        const speakerCount    = deriveSpeakerCount(refinedLines, parsedSegments);
        const mergedRaw       = transcriptLines.join("\n");
        const mergedRefined   = refinedLines.join("\n");

        clearTimerByKey("raw");
        updatePipelineStep("raw_transcript", s => ({ ...s, status: "completed", progress: 100 }));

        setActiveMeeting(prev => ({
          ...prev,
          rawTranscript:    mergedRaw     || "Không có văn bản gỡ băng từ API.",
          refinedTranscript: mergedRefined || mergedRaw || "Không có bản làm sạch từ API.",
          speakerCount,
          durationSecond: Math.max(durationSecond, prev.durationSecond),
          audioUrl: apiResult.audioUrl,
          apiRecordId: apiResult.id,
        }));

        updateTask(taskId, {
          progress: 35,
          steps: { raw_transcript: "success", diarization: "processing", speaker_summary: "waiting", minutes: "waiting" },
        });
        setNotice("Đã có nội dung chữ, đang tách hội thoại theo từng người...");

        // ── STEP 2: diarization (pure JS + fake timer) ──────────────────────
        updatePipelineStep("diarization", s => ({ ...s, status: "running", progress: 0 }));
        let diarProgress = 0;

        const diarTimer = setInterval(() => {
          if (processingRunIdRef.current !== runId) { clearInterval(diarTimer); return; }
          diarProgress = Math.min(diarProgress + 20, 100);
          updatePipelineStep("diarization", s => ({
            ...s,
            status: diarProgress >= 100 ? "completed" : "running",
            progress: diarProgress,
          }));
          if (diarProgress < 100) return;

          clearInterval(diarTimer);
          timerMapRef.current.delete("diar");
          if (processingRunIdRef.current !== runId) return;

          const safeSegments = parsedSegments.length ? parsedSegments : sourceMeeting.segments;
          const safeSpeakerCount = speakerCount > 0 ? speakerCount : new Set(safeSegments.map(s => s.speaker)).size;
          setActiveMeeting(prev => ({ ...prev, segments: safeSegments, speakerCount: safeSpeakerCount }));

          updateTask(taskId, {
            progress: 55,
            steps: { raw_transcript: "success", diarization: "success", speaker_summary: "processing", minutes: "waiting" },
          });
          setNotice("Đã tách theo người nói, đang tạo biên bản...");

          // ── STEP 3: speaker_summary ────────────────────────────────────────
          updatePipelineStep("speaker_summary", s => ({ ...s, status: "running", progress: 0 }));
          let summaryProgress = 0;
          const summaryTimer = setInterval(() => {
            if (processingRunIdRef.current !== runId) { clearInterval(summaryTimer); return; }
            summaryProgress = Math.min(summaryProgress + 8, 92);
            updatePipelineStep("speaker_summary", s => ({ ...s, progress: summaryProgress }));
          }, 240);
          timerMapRef.current.set("summary", summaryTimer);

          void (async () => {
            let minutesTimer: ReturnType<typeof setInterval> | null = null;
            try {
              const transcriptLinesForChat: string[] = safeSegments.length
                ? safeSegments.map(seg => `${seg.speaker} (${seg.startSecond}s - ${seg.endSecond}s): ${seg.text}`)
                : (mergedRefined || mergedRaw).split("\n").map(cleanTranscriptLine).filter(Boolean);

              setNotice("Đang tạo tóm tắt ý chính theo từng người...");
              const combinedResult = await generateSummaryAndMinutes({
                transcriptLines: transcriptLinesForChat,
                model: "qwen-plus",
                fileId: apiResult.id,
              });

              if (processingRunIdRef.current !== runId) {
                clearInterval(summaryTimer);
                return;
              }

              const summaries = combinedResult.speakerSummaries.length > 0
                ? combinedResult.speakerSummaries
                : buildSpeakerSummariesFromSegments(safeSegments, sourceMeeting.speakerSummaries);
              const nextMinutes = combinedResult.minutesMarkdown.trim() || "Không có biên bản từ API.";

              clearTimerByKey("summary");
              updatePipelineStep("speaker_summary", s => ({ ...s, status: "completed", progress: 100 }));
              setActiveMeeting(prev => ({ ...prev, speakerSummaries: summaries, mailTemplate: combinedResult.mailTemplate }));

              updateTask(taskId, {
                progress: 80,
                steps: { raw_transcript: "success", diarization: "success", speaker_summary: "success", minutes: "processing" },
              });

              // ── STEP 4: minutes (auto-save) ────────────────────────────────
              updatePipelineStep("minutes", s => ({ ...s, status: "running", progress: 15 }));
              setNotice("Đã có tóm tắt, đang tự động lưu biên bản...");

              let minutesProgress = 15;
              minutesTimer = setInterval(() => {
                if (processingRunIdRef.current !== runId) { if (minutesTimer) clearInterval(minutesTimer); return; }
                minutesProgress = Math.min(minutesProgress + 15, 90);
                updatePipelineStep("minutes", s => ({ ...s, progress: minutesProgress }));
              }, 200);
              timerMapRef.current.set("minutes", minutesTimer);

              let finalReportUrl: string | null = null;
              if (apiResult.id) {
                try {
                  const saved = await updateReport({ id: apiResult.id, textContent: nextMinutes });
                  finalReportUrl = saved.reportUrl;
                } catch {
                  setNotice("Lưu tự động thất bại. Vui lòng lưu biên bản thủ công.");
                }
              }

              if (processingRunIdRef.current !== runId) {
                if (minutesTimer) clearInterval(minutesTimer);
                return;
              }

              clearTimerByKey("minutes");
              updatePipelineStep("minutes", s => ({ ...s, status: "completed", progress: 100 }));
              setActiveMeeting(prev => ({
                ...prev,
                processingStatus: "completed",
                durationSecond: Math.max(durationSecond, 30),
                minutes: nextMinutes,
                reportUrl: finalReportUrl || prev.reportUrl,
              }));
              setMinutesDraft(nextMinutes);
              setNotice(finalReportUrl
                ? "Phiên họp đã sẵn sàng. Biên bản đã được lưu tự động."
                : "Phiên họp đã sẵn sàng. Lưu biên bản thủ công để gửi mail.",
              );

              updateTask(taskId, {
                status: "completed", progress: 100, completedAt: Date.now(),
                steps: { raw_transcript: "success", diarization: "success", speaker_summary: "success", minutes: "success" },
              });
              scheduleAutoDismiss(taskId, 30_000);
              queryClient.invalidateQueries({ queryKey: ["files-infinite"] });

            } catch (error) {
              clearTimerByKey("summary");
              if (minutesTimer) { clearInterval(minutesTimer); timerMapRef.current.delete("minutes"); }
              if (processingRunIdRef.current !== runId) return;
              const msg = error instanceof Error ? error.message : String(error);
              markPipelineAsError(`Lỗi tạo biên bản: ${msg}`, "minutes");
              updateTask(taskId, { status: "failed", errorMessage: msg });
              scheduleAutoDismiss(taskId, 60_000);
            }
          })();
        }, 250);
        timerMapRef.current.set("diar", diarTimer);

      } catch (error) {
        clearTimerByKey("raw");
        if (processingRunIdRef.current !== runId) return;
        const msg = error instanceof Error ? error.message : "Không thể gọi API diarize/transcribe.";
        markPipelineAsError(`Lỗi tạo bản gỡ băng gốc: ${msg}`, "raw_transcript");
        updateTask(taskId, { status: "failed", errorMessage: msg });
        scheduleAutoDismiss(taskId, 60_000);
      }
    })();
  }, [addTask, updateTask, scheduleAutoDismiss, clearAllTimers, clearTimerByKey, updatePipelineStep, markPipelineAsError, buildBubbleSteps, queryClient]);

  // ─── retryPipeline ───────────────────────────────────────────────────────────

  const retryPipeline = useCallback(({ selectedFile, recordingFile, recordingSecond }: RetryPipelineArgs) => {
    const busy = activeMeeting.processingStatus === "uploading" || activeMeeting.processingStatus === "processing";
    if (!failedStepId || busy) return;

    const source = activeMeeting.inputSource;
    if (source === "upload" || source === "assigned" || source === "self_upload") {
      if (!selectedFile && !activeMeeting.apiRecordId) {
        setNotice("Không tìm thấy tệp hoặc ID phiên họp để thử lại quy trình.");
        return;
      }
      setNotice("Đang thử lại quy trình từ đầu...");
      startProcessing({
        source,
        fileName: activeMeeting.fileName,
        durationSecond: Math.max(activeMeeting.durationSecond, 1),
        sourceAudioFile: selectedFile,
        fileId: activeMeeting.apiRecordId,
      });
      return;
    }

    if (!recordingFile) {
      setNotice("Không tìm thấy bản thu hiện tại để thử lại quy trình.");
      return;
    }
    setNotice("Đang thử lại quy trình từ đầu...");
    startProcessing({
      source: "recording",
      fileName: recordingFile.name,
      durationSecond: Math.max(recordingSecond || activeMeeting.durationSecond, 1),
      sourceAudioFile: recordingFile,
    });
  }, [activeMeeting, failedStepId, startProcessing]);

  // ─── resetPipeline ───────────────────────────────────────────────────────────

  const resetPipeline = useCallback(() => {
    processingRunIdRef.current++;
    clearAllTimers();
    if (taskIdRef.current) {
      removeTask(taskIdRef.current);
      taskIdRef.current = null;
    }
    setActiveMeeting(initialMeeting);
    setPipelineSteps(createInitialPipelineSteps());
    setFailedStepId(null);
    setNotice("Sẵn sàng nhận tệp để bắt đầu xử lý.");
    setMinutesDraft(initialMeeting.minutes);
  }, [clearAllTimers, removeTask]);

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const busyProcessing = activeMeeting.processingStatus === "uploading" || activeMeeting.processingStatus === "processing";

  const stageProgress = useMemo(() => {
    if (activeMeeting.processingStatus === "completed") return 100;
    if (activeMeeting.processingStatus === "idle") return 0;
    return Math.max(0, Math.min(100, Math.round(
      pipelineSteps.reduce((acc, step) => acc + (step.progress * (PIPELINE_STEP_WEIGHT[step.id] ?? 0)) / 100, 0)
    )));
  }, [activeMeeting.processingStatus, pipelineSteps]);

  const canRetryPipeline = Boolean(failedStepId) && !busyProcessing;

  const value = useMemo<MeetingPipelineContextValue>(() => ({
    activeMeeting, setActiveMeeting,
    pipelineSteps, failedStepId,
    notice, setNotice,
    minutesDraft, setMinutesDraft,
    busyProcessing, stageProgress, canRetryPipeline,
    startProcessing, retryPipeline, resetPipeline,
  }), [
    activeMeeting, pipelineSteps, failedStepId, notice, minutesDraft,
    busyProcessing, stageProgress, canRetryPipeline,
    startProcessing, retryPipeline, resetPipeline,
  ]);

  return (
    <MeetingPipelineContext.Provider value={value}>
      {children}
    </MeetingPipelineContext.Provider>
  );
}

export function useMeetingPipeline(): MeetingPipelineContextValue {
  const ctx = useContext(MeetingPipelineContext);
  if (!ctx) throw new Error("useMeetingPipeline must be used within MeetingPipelineProvider");
  return ctx;
}
