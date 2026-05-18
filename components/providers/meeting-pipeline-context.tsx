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
  pollTaskUntilDone,
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
import { parseApiError } from "@/lib/api-error";
import { initialMeeting } from "@/app/(main)/meeting/_lib/initial-meeting";
import { useBackgroundTask } from "@/hooks/use-background-task";
import {
  saveTaskToStorage,
  loadTaskFromStorage,
  clearTaskFromStorage,
  type StoredPipelineTask,
} from "@/lib/pipeline-task-storage";
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
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // ─── Wake Lock helpers ──────────────────────────────────────────────────────

  const acquireWakeLock = useCallback(async () => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request("screen");
    } catch {
      // Không hỗ trợ hoặc bị từ chối — bỏ qua, không block pipeline
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

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

  // ─── Steps 3+4: speaker_summary → minutes ──────────────────────────────────
  // Tách ra để dùng lại khi resume từ step "speaker_summary"

  const runSpeakerSummaryAndMinutes = useCallback(async ({
    runId,
    taskId,
    apiRecordId,
    durationSecond,
    safeSegments,
    mergedRefined,
    mergedRaw,
    fileName,
    source,
  }: {
    runId: number;
    taskId: string;
    apiRecordId: number | undefined;
    durationSecond: number;
    safeSegments: TranscriptSegment[];
    mergedRefined: string;
    mergedRaw: string;
    fileName: string;
    source: string;
  }) => {
    let minutesTimer: ReturnType<typeof setInterval> | null = null;
    try {
      const transcriptLinesForChat: string[] = safeSegments.length
        ? safeSegments.map(seg => `${seg.speaker} (${seg.startSecond}s - ${seg.endSecond}s): ${seg.text}`)
        : (mergedRefined || mergedRaw).split("\n").map(cleanTranscriptLine).filter(Boolean);

      setNotice("Đang tạo tóm tắt ý chính theo từng người...");
      const combinedResult = await generateSummaryAndMinutes({
        transcriptLines: transcriptLinesForChat,
        model: "qwen-plus",
        fileId: apiRecordId,
        signal: abortControllerRef.current?.signal,
        onTaskId: (tid) => {
          saveTaskToStorage({
            taskId: tid,
            step: "speaker_summary",
            pipelineRunId: String(runId),
            savedAt: Date.now(),
            fileName,
            source,
            durationSecond,
            step1Result: apiRecordId ? {
              apiRecordId,
              rawTranscript: mergedRaw,
              refinedTranscript: mergedRefined,
              segments: safeSegments,
              speakerCount: new Set(safeSegments.map(s => s.speaker)).size,
            } : undefined,
          });
        },
      });

      if (processingRunIdRef.current !== runId) {
        clearTimerByKey("summary");
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
      if (apiRecordId) {
        try {
          const saved = await updateReport({ id: apiRecordId, textContent: nextMinutes });
          finalReportUrl = saved.reportUrl;
        } catch (saveError) {
          const saveMsg = parseApiError(saveError);
          setNotice(`Lưu tự động thất bại: ${saveMsg}. Vui lòng lưu biên bản thủ công.`);
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

      clearTaskFromStorage();
      updateTask(taskId, {
        status: "completed", progress: 100, completedAt: Date.now(),
        steps: { raw_transcript: "success", diarization: "success", speaker_summary: "success", minutes: "success" },
      });
      releaseWakeLock();
      scheduleAutoDismiss(taskId, 30_000);
      queryClient.invalidateQueries({ queryKey: ["files-infinite"] });

    } catch (error) {
      releaseWakeLock();
      clearTimerByKey("summary");
      if (minutesTimer) { clearInterval(minutesTimer); timerMapRef.current.delete("minutes"); }
      if (processingRunIdRef.current !== runId) return;
      clearTaskFromStorage();
      const msg = parseApiError(error);
      markPipelineAsError(`Lỗi tạo biên bản: ${msg}`, "minutes");
      updateTask(taskId, { status: "failed", errorMessage: msg });
      scheduleAutoDismiss(taskId, 60_000);
    }
  }, [
    clearTimerByKey, updatePipelineStep, markPipelineAsError,
    updateTask, releaseWakeLock, scheduleAutoDismiss, queryClient,
  ]);

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

    // Hủy run cũ nếu có
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

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

    void acquireWakeLock();

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
          ? await diarizeAndTranscribeByFileId({
              fileId,
              language: "Vietnamese",
              signal: abortControllerRef.current?.signal,
              onTaskId: (tid) => {
                saveTaskToStorage({
                  taskId: tid,
                  step: "raw_transcript",
                  pipelineRunId: String(runId),
                  savedAt: Date.now(),
                  fileName,
                  source,
                  fileId,
                  durationSecond,
                });
              },
            })
          : await diarizeAndTranscribe({
              file: sourceAudioFile!,
              language: "Vietnamese",
              signal: abortControllerRef.current?.signal,
              onTaskId: (tid) => {
                saveTaskToStorage({
                  taskId: tid,
                  step: "raw_transcript",
                  pipelineRunId: String(runId),
                  savedAt: Date.now(),
                  fileName,
                  source,
                  durationSecond,
                });
              },
            });

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

          // ── STEP 3+4 ───────────────────────────────────────────────────────
          updatePipelineStep("speaker_summary", s => ({ ...s, status: "running", progress: 0 }));
          let summaryProgress = 0;
          const summaryTimer = setInterval(() => {
            if (processingRunIdRef.current !== runId) { clearInterval(summaryTimer); return; }
            summaryProgress = Math.min(summaryProgress + 8, 92);
            updatePipelineStep("speaker_summary", s => ({ ...s, progress: summaryProgress }));
          }, 240);
          timerMapRef.current.set("summary", summaryTimer);

          void runSpeakerSummaryAndMinutes({
            runId,
            taskId,
            apiRecordId: apiResult.id,
            durationSecond,
            safeSegments,
            mergedRefined,
            mergedRaw,
            fileName,
            source,
          });
        }, 250);
        timerMapRef.current.set("diar", diarTimer);

      } catch (error) {
        releaseWakeLock();
        clearTimerByKey("raw");
        if (processingRunIdRef.current !== runId) return;
        clearTaskFromStorage();
        const msg = parseApiError(error);
        markPipelineAsError(`Lỗi tạo bản gỡ băng gốc: ${msg}`, "raw_transcript");
        updateTask(taskId, { status: "failed", errorMessage: msg });
        scheduleAutoDismiss(taskId, 60_000);
      }
    })();
  }, [
    addTask, updateTask, scheduleAutoDismiss, clearAllTimers, clearTimerByKey,
    updatePipelineStep, markPipelineAsError, buildBubbleSteps, queryClient,
    acquireWakeLock, releaseWakeLock, runSpeakerSummaryAndMinutes,
  ]);

  // ─── Resume từ localStorage (sau page reload hoặc network restore) ──────────

  const resumeFromStoredTask = useCallback(async (stored: StoredPipelineTask) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const runId = ++processingRunIdRef.current;
    const taskId = `meeting-pipeline-resume-${Date.now()}`;
    taskIdRef.current = taskId;

    addTask({
      id: taskId,
      type: "meeting_pipeline",
      label: `Tiếp tục xử lý: ${stored.fileName || "cuộc họp"}`,
      status: "running",
      progress: stored.step === "raw_transcript" ? 15 : 60,
      steps: {
        raw_transcript: stored.step === "raw_transcript" ? "processing" : "success",
        diarization: stored.step === "raw_transcript" ? "waiting" : "success",
        speaker_summary: stored.step === "speaker_summary" ? "processing" : "waiting",
        minutes: "waiting",
      },
      createdAt: Date.now(),
    });

    void acquireWakeLock();

    try {
      setNotice("Đang tiếp tục xử lý sau khi kết nối được phục hồi...");

      if (stored.step === "raw_transcript") {
        // Vẫn đang chờ kết quả step 1 → poll tiếp
        updatePipelineStep("raw_transcript", s => ({ ...s, status: "running", progress: 50 }));
        const rawData = await pollTaskUntilDone(stored.taskId, signal);

        if (processingRunIdRef.current !== runId) return;

        // Parse kết quả như trong diarizeAndTranscribeByFileId
        const payload = rawData as {
          raw_transcription?: unknown; transcription?: unknown;
          refined_transcription?: unknown; audio_url?: unknown;
          transcribe_url?: unknown; id?: unknown; filename?: unknown; status?: unknown;
        };

        const ensureStrArr = (v: unknown): string[] =>
          Array.isArray(v) ? v.map(x => String(x ?? "").trim()).filter(Boolean) : [];

        const rawTranscription = ensureStrArr(
          Array.isArray(payload.raw_transcription) ? payload.raw_transcription : payload.transcription
        );
        if (!rawTranscription.length) throw new Error("Dữ liệu polling không hợp lệ.");

        const refinedTranscription = ensureStrArr(
          Array.isArray(payload.refined_transcription) ? payload.refined_transcription : payload.raw_transcription
        );
        const transcriptLines = rawTranscription.map(cleanTranscriptLine).filter(Boolean);
        const refinedLines    = (refinedTranscription.length ? refinedTranscription : rawTranscription).map(cleanTranscriptLine).filter(Boolean);
        const parsedSegments  = parseTranscriptSegments(refinedLines);
        const speakerCount    = deriveSpeakerCount(refinedLines, parsedSegments);
        const mergedRaw       = transcriptLines.join("\n");
        const mergedRefined   = refinedLines.join("\n");
        const apiRecordId     = typeof payload.id === "number" ? payload.id : undefined;
        const audioUrl        = typeof payload.audio_url === "string" ? payload.audio_url : undefined;

        clearTimerByKey("raw");
        updatePipelineStep("raw_transcript", s => ({ ...s, status: "completed", progress: 100 }));
        setActiveMeeting(prev => ({
          ...prev,
          rawTranscript: mergedRaw || "Không có văn bản gỡ băng từ API.",
          refinedTranscript: mergedRefined || mergedRaw || "Không có bản làm sạch từ API.",
          speakerCount,
          audioUrl,
          apiRecordId,
        }));

        updateTask(taskId, {
          progress: 35,
          steps: { raw_transcript: "success", diarization: "processing", speaker_summary: "waiting", minutes: "waiting" },
        });

        // Diarization (pure JS)
        updatePipelineStep("diarization", s => ({ ...s, status: "running", progress: 0 }));
        await new Promise<void>(res => setTimeout(res, 300));
        if (processingRunIdRef.current !== runId) return;

        const safeSegments = parsedSegments.length ? parsedSegments : sourceMeeting.segments;
        const safeSpeakerCount = speakerCount > 0 ? speakerCount : new Set(safeSegments.map(s => s.speaker)).size;
        setActiveMeeting(prev => ({ ...prev, segments: safeSegments, speakerCount: safeSpeakerCount }));
        updatePipelineStep("diarization", s => ({ ...s, status: "completed", progress: 100 }));

        updateTask(taskId, {
          progress: 55,
          steps: { raw_transcript: "success", diarization: "success", speaker_summary: "processing", minutes: "waiting" },
        });

        updatePipelineStep("speaker_summary", s => ({ ...s, status: "running", progress: 0 }));
        let summaryProgress = 0;
        const summaryTimer = setInterval(() => {
          if (processingRunIdRef.current !== runId) { clearInterval(summaryTimer); return; }
          summaryProgress = Math.min(summaryProgress + 8, 92);
          updatePipelineStep("speaker_summary", s => ({ ...s, progress: summaryProgress }));
        }, 240);
        timerMapRef.current.set("summary", summaryTimer);

        await runSpeakerSummaryAndMinutes({
          runId,
          taskId,
          apiRecordId,
          durationSecond: stored.durationSecond,
          safeSegments,
          mergedRefined,
          mergedRaw,
          fileName: stored.fileName,
          source: stored.source,
        });

      } else {
        // step === "speaker_summary" → step 1 đã xong, restore dữ liệu rồi chạy lại step 3+4
        const s1 = stored.step1Result;
        if (!s1) throw new Error("Thiếu dữ liệu bước 1 để tiếp tục.");

        updatePipelineStep("raw_transcript", s => ({ ...s, status: "completed", progress: 100 }));
        updatePipelineStep("diarization", s => ({ ...s, status: "completed", progress: 100 }));

        setActiveMeeting(prev => ({
          ...prev,
          rawTranscript: s1.rawTranscript,
          refinedTranscript: s1.refinedTranscript,
          audioUrl: s1.audioUrl,
          apiRecordId: s1.apiRecordId,
          segments: s1.segments,
          speakerCount: s1.speakerCount,
        }));

        setNotice("Đang tiếp tục tạo tóm tắt và biên bản...");

        updatePipelineStep("speaker_summary", s => ({ ...s, status: "running", progress: 0 }));
        let summaryProgress2 = 0;
        const summaryTimer2 = setInterval(() => {
          if (processingRunIdRef.current !== runId) { clearInterval(summaryTimer2); return; }
          summaryProgress2 = Math.min(summaryProgress2 + 8, 92);
          updatePipelineStep("speaker_summary", s => ({ ...s, progress: summaryProgress2 }));
        }, 240);
        timerMapRef.current.set("summary", summaryTimer2);

        await runSpeakerSummaryAndMinutes({
          runId,
          taskId,
          apiRecordId: s1.apiRecordId,
          durationSecond: stored.durationSecond,
          safeSegments: s1.segments,
          mergedRefined: s1.refinedTranscript,
          mergedRaw: s1.rawTranscript,
          fileName: stored.fileName,
          source: stored.source,
        });
      }

    } catch (error) {
      releaseWakeLock();
      if (processingRunIdRef.current !== runId) return;
      clearTaskFromStorage();
      const msg = parseApiError(error);
      const failedStep: PipelineStepId = stored.step === "raw_transcript" ? "raw_transcript" : "speaker_summary";
      markPipelineAsError(`Lỗi tiếp tục xử lý: ${msg}`, failedStep);
      updateTask(taskId, { status: "failed", errorMessage: msg });
      scheduleAutoDismiss(taskId, 60_000);
    }
  }, [
    addTask, updateTask, scheduleAutoDismiss, clearTimerByKey,
    updatePipelineStep, markPipelineAsError, acquireWakeLock, releaseWakeLock,
    runSpeakerSummaryAndMinutes,
  ]);

  // ─── Mount: kiểm tra localStorage, resume nếu có task đang dở ───────────────

  useEffect(() => {
    const stored = loadTaskFromStorage();
    if (!stored) return;

    // Restore UI state để user thấy pipeline đang chạy
    setActiveMeeting(prev => ({
      ...prev,
      title: `Tiếp tục xử lý: ${stored.fileName || "cuộc họp"}`,
      fileName: stored.fileName || "",
      processingStatus: "processing",
    }));

    const steps = createInitialPipelineSteps().map(s => {
      if (stored.step === "raw_transcript") {
        return s.id === "raw_transcript" ? { ...s, status: "running" as const, progress: 50 } : s;
      }
      // speaker_summary: step 1+2 đã xong
      if (s.id === "raw_transcript" || s.id === "diarization") return { ...s, status: "completed" as const, progress: 100 };
      if (s.id === "speaker_summary") return { ...s, status: "running" as const, progress: 50 };
      return s;
    });
    setPipelineSteps(steps);
    setNotice("Đang kết nối lại và tiếp tục xử lý...");

    void resumeFromStoredTask(stored);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ chạy một lần khi mount

  // ─── Visibility/online/focus/pageshow: re-acquire wake lock, re-notice ───────

  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;
      if (activeMeeting.processingStatus === "processing") {
        await acquireWakeLock();
        return;
      }
      if (activeMeeting.processingStatus === "error" && failedStepId === "raw_transcript") {
        setNotice('Có vẻ màn hình bị khóa trong khi đang xử lý. Giữ màn hình sáng và nhấn "Thử lại" để tiếp tục.');
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [activeMeeting.processingStatus, failedStepId, acquireWakeLock]);

  useEffect(() => {
    const onOnline = () => {
      // Polling loop đang chạy sẽ tự retry sau network restore
      // Chỉ re-acquire wake lock nếu đang processing
      if (activeMeeting.processingStatus === "processing") {
        void acquireWakeLock();
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onOnline);
    window.addEventListener("pageshow", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onOnline);
      window.removeEventListener("pageshow", onOnline);
    };
  }, [activeMeeting.processingStatus, acquireWakeLock]);

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
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    clearTaskFromStorage();
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
