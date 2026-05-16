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
  retryFromStep: (stepId: PipelineStepId) => void;
  resetPipeline: () => void;
}

export const MeetingPipelineContext = createContext<MeetingPipelineContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calls fn(), and on first failure calls onRetrying then retries once after delayMs.
 * shouldAbort() is checked before retrying — if true, re-throws the original error immediately.
 */
async function callWithAutoRetry<T>(
  fn: () => Promise<T>,
  onRetrying: () => void,
  shouldAbort: () => boolean,
  delayMs = 1500,
): Promise<T> {
  try {
    return await fn();
  } catch (firstError) {
    if (shouldAbort()) throw firstError;
    onRetrying();
    await new Promise<void>(r => setTimeout(r, delayMs));
    if (shouldAbort()) throw firstError;
    return await fn();
  }
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
  const retryAttemptsRef = useRef<Record<PipelineStepId, number>>({
    raw_transcript: 0, diarization: 0, speaker_summary: 0, minutes: 0,
  });

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

  // ─── runStep3And4 ───────────────────────────────────────────────────────────
  // Extracted so it can be called both from startProcessing and retryFromStep.

  const runStep3And4 = useCallback(async ({
    runId,
    taskId,
    safeSegments,
    mergedRefined,
    mergedRaw,
    apiRecordId,
    durationSecond,
  }: {
    runId: number;
    taskId: string;
    safeSegments: TranscriptSegment[];
    mergedRefined: string;
    mergedRaw: string;
    apiRecordId?: number;
    durationSecond: number;
  }) => {
    // ── STEP 3: speaker_summary ──────────────────────────────────────────────
    updatePipelineStep("speaker_summary", s => ({ ...s, status: "running", progress: 0 }));

    let summaryProgress = 0;
    const summaryTimer = setInterval(() => {
      if (processingRunIdRef.current !== runId) { clearInterval(summaryTimer); return; }
      summaryProgress = Math.min(summaryProgress + 8, 92);
      updatePipelineStep("speaker_summary", s => ({ ...s, progress: summaryProgress }));
    }, 240);
    timerMapRef.current.set("summary", summaryTimer);

    let minutesTimer: ReturnType<typeof setInterval> | null = null;
    try {
      const transcriptLinesForChat: string[] = safeSegments.length
        ? safeSegments.map(seg => `${seg.speaker} (${seg.startSecond}s - ${seg.endSecond}s): ${seg.text}`)
        : (mergedRefined || mergedRaw).split("\n").map(cleanTranscriptLine).filter(Boolean);

      setNotice("Đang tạo tóm tắt ý chính theo từng người...");

      const combinedResult = await callWithAutoRetry(
        () => generateSummaryAndMinutes({
          transcriptLines: transcriptLinesForChat,
          model: "qwen-plus",
          fileId: apiRecordId,
        }),
        () => {
          if (processingRunIdRef.current !== runId) return;
          retryAttemptsRef.current.speaker_summary++;
          clearTimerByKey("summary");
          setNotice("Bước tóm tắt gặp lỗi tạm thời, đang tự động thử lại...");
          let p = 0;
          const t = setInterval(() => {
            if (processingRunIdRef.current !== runId) { clearInterval(t); return; }
            p = Math.min(p + 8, 92);
            updatePipelineStep("speaker_summary", s => ({ ...s, progress: p }));
          }, 240);
          timerMapRef.current.set("summary", t);
        },
        () => processingRunIdRef.current !== runId,
      );

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

      // ── STEP 4: minutes (auto-save) ────────────────────────────────────────
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
      markPipelineAsError(`Lỗi tạo tóm tắt: ${msg}`, "speaker_summary");
      updateTask(taskId, { status: "failed", errorMessage: msg });
      scheduleAutoDismiss(taskId, 60_000);
    }
  }, [updatePipelineStep, clearTimerByKey, markPipelineAsError, updateTask, scheduleAutoDismiss, queryClient]);

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
    retryAttemptsRef.current = { raw_transcript: 0, diarization: 0, speaker_summary: 0, minutes: 0 };

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
        const apiResult = await callWithAutoRetry(
          () => fileId
            ? diarizeAndTranscribeByFileId({ fileId, language: "Vietnamese" })
            : diarizeAndTranscribe({ file: sourceAudioFile!, language: "Vietnamese" }),
          () => {
            if (processingRunIdRef.current !== runId) return;
            retryAttemptsRef.current.raw_transcript++;
            setNotice("Bước gỡ băng gặp lỗi tạm thời, đang tự động thử lại...");
            // Reset progress bar to show retry is starting
            rawProgress = 5;
            updatePipelineStep("raw_transcript", s => ({ ...s, progress: 5 }));
          },
          () => processingRunIdRef.current !== runId,
        );

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

          void runStep3And4({
            runId, taskId,
            safeSegments,
            mergedRefined,
            mergedRaw,
            apiRecordId: apiResult.id,
            durationSecond,
          });
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
  }, [addTask, updateTask, scheduleAutoDismiss, clearAllTimers, clearTimerByKey, updatePipelineStep, markPipelineAsError, runStep3And4]);

  // ─── retryFromStep ───────────────────────────────────────────────────────────
  // Retry from a specific step using data already in activeMeeting state.
  // For raw_transcript, caller should use retryPipeline() instead.

  const retryFromStep = useCallback((stepId: PipelineStepId) => {
    const busy = activeMeeting.processingStatus === "uploading" || activeMeeting.processingStatus === "processing";
    if (busy) return;

    if (stepId === "raw_transcript") return; // handled by retryPipeline

    const runId = ++processingRunIdRef.current;
    clearAllTimers();
    retryAttemptsRef.current[stepId] = 0;
    setFailedStepId(null);
    setActiveMeeting(prev => ({ ...prev, processingStatus: "processing" }));

    const taskId = `meeting-pipeline-retry-${Date.now()}`;
    taskIdRef.current = taskId;

    if (stepId === "speaker_summary" || stepId === "diarization") {
      // Retry from step 3 — steps 1+2 already succeeded, data is in state
      setPipelineSteps(prev => prev.map(s => {
        if (s.id === "speaker_summary") return { ...s, status: "running", progress: 0 };
        if (s.id === "minutes") return { ...s, status: "pending", progress: 0 };
        return s;
      }));

      const safeSegments = activeMeeting.segments;
      const mergedRefined = activeMeeting.refinedTranscript ?? activeMeeting.rawTranscript;
      const mergedRaw = activeMeeting.rawTranscript;

      addTask({
        id: taskId, type: "meeting_pipeline",
        label: `Thử lại: ${activeMeeting.fileName}`,
        status: "running", progress: 55,
        steps: { raw_transcript: "success", diarization: "success", speaker_summary: "processing", minutes: "waiting" },
        createdAt: Date.now(),
      });

      setNotice("Đang thử lại từ bước tóm tắt...");
      void runStep3And4({
        runId, taskId, safeSegments, mergedRefined, mergedRaw,
        apiRecordId: activeMeeting.apiRecordId,
        durationSecond: activeMeeting.durationSecond,
      });
      return;
    }

    if (stepId === "minutes") {
      // Retry only step 4 — step 3 already succeeded
      setPipelineSteps(prev => prev.map(s =>
        s.id === "minutes" ? { ...s, status: "running", progress: 15 } : s
      ));

      addTask({
        id: taskId, type: "meeting_pipeline",
        label: `Thử lại lưu biên bản: ${activeMeeting.fileName}`,
        status: "running", progress: 80,
        steps: { raw_transcript: "success", diarization: "success", speaker_summary: "success", minutes: "processing" },
        createdAt: Date.now(),
      });

      setNotice("Đang thử lại lưu biên bản...");
      const apiRecordId = activeMeeting.apiRecordId;
      const textContent = minutesDraft;

      void (async () => {
        let minutesTimer: ReturnType<typeof setInterval> | null = null;
        try {
          if (!apiRecordId) throw new Error("Không tìm thấy ID phiên họp để lưu biên bản.");

          let minutesProgress = 15;
          minutesTimer = setInterval(() => {
            if (processingRunIdRef.current !== runId) { if (minutesTimer) clearInterval(minutesTimer); return; }
            minutesProgress = Math.min(minutesProgress + 15, 90);
            updatePipelineStep("minutes", s => ({ ...s, progress: minutesProgress }));
          }, 200);
          timerMapRef.current.set("minutes", minutesTimer);

          const saved = await updateReport({ id: apiRecordId, textContent });
          if (processingRunIdRef.current !== runId) { clearInterval(minutesTimer!); return; }

          clearTimerByKey("minutes");
          updatePipelineStep("minutes", s => ({ ...s, status: "completed", progress: 100 }));
          setActiveMeeting(prev => ({ ...prev, processingStatus: "completed", reportUrl: saved.reportUrl }));
          setNotice("Biên bản đã được lưu thành công.");
          updateTask(taskId, {
            status: "completed", progress: 100, completedAt: Date.now(),
            steps: { raw_transcript: "success", diarization: "success", speaker_summary: "success", minutes: "success" },
          });
          scheduleAutoDismiss(taskId, 30_000);
        } catch (error) {
          if (minutesTimer) { clearInterval(minutesTimer); timerMapRef.current.delete("minutes"); }
          if (processingRunIdRef.current !== runId) return;
          const msg = error instanceof Error ? error.message : String(error);
          markPipelineAsError(`Lỗi lưu biên bản: ${msg}`, "minutes");
          updateTask(taskId, { status: "failed", errorMessage: msg });
          scheduleAutoDismiss(taskId, 60_000);
        }
      })();
    }
  }, [activeMeeting, minutesDraft, clearAllTimers, clearTimerByKey, updatePipelineStep, markPipelineAsError, addTask, updateTask, scheduleAutoDismiss, runStep3And4]);

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
    startProcessing, retryPipeline, retryFromStep, resetPipeline,
  }), [
    activeMeeting, pipelineSteps, failedStepId, notice, minutesDraft,
    busyProcessing, stageProgress, canRetryPipeline,
    startProcessing, retryPipeline, retryFromStep, resetPipeline,
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
