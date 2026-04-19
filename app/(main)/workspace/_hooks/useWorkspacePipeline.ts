import { useEffect, useRef, useState } from "react";

import {
  createInitialPipelineSteps,
  type PipelineStep,
} from "@/app/(main)/workspace/_lib/pipeline-constants";
import {
  buildSpeakerSummariesFromSegments,
  cleanTranscriptLine,
  deriveSpeakerCount,
  parseTranscriptSegments,
} from "@/app/(main)/workspace/_lib/transcript-utils";
import type {
  AudioInputSource,
  MeetingMailTemplate,
  MeetingRecord,
  SpeakerSummary,
  TranscriptSegment,
} from "@/lib/types/meeting";

type DiarizeTranscribeMutation = {
  mutateAsync: (params: {
    file: File;
    language: string;
  }) => Promise<{
    rawTranscription: string[];
    refinedTranscription: string[];
    audioUrl?: string;
    id?: number;
  }>;
};

type SummaryMinutesMutation = {
  mutateAsync: (params: {
    transcriptLines: string[];
    model: string;
  }) => Promise<{
    speakerSummaries: SpeakerSummary[];
    minutesMarkdown: string;
    mailTemplate?: MeetingMailTemplate;
  }>;
};

type UseWorkspacePipelineParams = {
  sourceMeeting: MeetingRecord;
  setActiveMeeting: React.Dispatch<React.SetStateAction<MeetingRecord>>;
  setMinutesDraft: React.Dispatch<React.SetStateAction<string>>;
  setNotice: React.Dispatch<React.SetStateAction<string>>;
  setUploadProgress: React.Dispatch<React.SetStateAction<number>>;
  setProcessingProgress: React.Dispatch<React.SetStateAction<number>>;
  diarizeTranscribeMutation: DiarizeTranscribeMutation;
  summaryMinutesMutation: SummaryMinutesMutation;
};

type StartProcessingArgs = {
  source: AudioInputSource;
  fileName: string;
  durationSecond: number;
  sourceAudioFile: File | null;
};

type RetryPipelineArgs = {
  busyProcessing: boolean;
  activeMeeting: MeetingRecord;
  selectedFile: File | null;
  selectedFileName: string | null;
  selectedFileDurationSecond: number | null;
  recordingFile: File | null;
  recordingSecond: number;
};

function clearTimer(
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
) {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
}

export function useWorkspacePipeline({
  sourceMeeting,
  setActiveMeeting,
  setMinutesDraft,
  setNotice,
  setUploadProgress,
  setProcessingProgress,
  diarizeTranscribeMutation,
  summaryMinutesMutation,
}: UseWorkspacePipelineParams) {
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    createInitialPipelineSteps,
  );
  const [failedStepId, setFailedStepId] = useState<PipelineStep["id"] | null>(
    null,
  );

  const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const processingRunIdRef = useRef(0);

  const updatePipelineStep = (
    stepId: PipelineStep["id"],
    updater: (step: PipelineStep) => PipelineStep,
  ) => {
    setPipelineSteps((prev) =>
      prev.map((step) => (step.id === stepId ? updater(step) : step)),
    );
  };

  const resetPipelineSteps = () => {
    setPipelineSteps(createInitialPipelineSteps());
  };

  const markPipelineAsError = (
    message: string,
    nextFailedStepId?: PipelineStep["id"],
  ) => {
    if (nextFailedStepId) {
      setFailedStepId(nextFailedStepId);
      updatePipelineStep(nextFailedStepId, (step) => ({
        ...step,
        status: "error",
      }));
    } else {
      setFailedStepId(null);
    }

    setActiveMeeting((prev) => ({
      ...prev,
      processingStatus: "error",
    }));
    setNotice(message);
  };

  function startProcessing({
    source,
    fileName,
    durationSecond,
    sourceAudioFile,
  }: StartProcessingArgs) {
    if (!fileName) {
      clearTimer(uploadTimerRef);
      clearTimer(processingTimerRef);
      markPipelineAsError(
        "Không tìm thấy đầu vào hợp lệ cho pipeline.",
        "raw_transcript",
      );
      return;
    }

    if (!sourceAudioFile) {
      clearTimer(uploadTimerRef);
      clearTimer(processingTimerRef);
      markPipelineAsError(
        source === "upload"
          ? "Không tìm thấy file upload để gọi API dịch băng."
          : "Không tìm thấy bản thu để gọi API dịch băng.",
        "raw_transcript",
      );
      return;
    }

    const runId = processingRunIdRef.current + 1;
    processingRunIdRef.current = runId;

    clearTimer(uploadTimerRef);
    clearTimer(processingTimerRef);

    setUploadProgress(0);
    setProcessingProgress(0);
    resetPipelineSteps();

    setActiveMeeting((prev) => ({
      ...prev,
      title:
        source === "upload"
          ? `Phiên xử lý ${fileName}`
          : "Phiên xử lý bản thu trực tiếp",
      fileName,
      inputSource: source,
      processingStatus: "processing",
      emailStatus: "not_sent",
      segments: [],
      speakerSummaries: [],
      minutes: "Biên bản điều hành đang được tạo...",
      rawTranscript: "Transcript thô đang được tạo từ audio...",
      refinedTranscript: "Bản làm sạch đang được chuẩn bị...",
      speakerCount: 0,
      mailTemplate: undefined,
    }));
    setNotice("Bắt đầu chạy từng bước xử lý...");

    let uploadLocalProgress = 100;

    uploadTimerRef.current = setInterval(() => {
      if (processingRunIdRef.current !== runId) {
        clearTimer(uploadTimerRef);
        return;
      }

      uploadLocalProgress = Math.min(uploadLocalProgress + 14, 100);
      setUploadProgress(uploadLocalProgress);

      if (uploadLocalProgress < 100) {
        return;
      }

      clearTimer(uploadTimerRef);

      if (processingRunIdRef.current !== runId) {
        return;
      }

      setActiveMeeting((current) => ({
        ...current,
        processingStatus: "processing",
      }));
      setNotice("Đang xử lý nội dung audio...");

      const runPipelineStep = (
        stepId: PipelineStep["id"],
        increment: number,
        intervalMs: number,
        onDone: () => void,
      ) => {
        let localProgress = 0;

        updatePipelineStep(stepId, (step) => ({
          ...step,
          status: "running",
          progress: 0,
        }));

        processingTimerRef.current = setInterval(() => {
          if (processingRunIdRef.current !== runId) {
            clearTimer(processingTimerRef);
            return;
          }

          localProgress = Math.min(localProgress + increment, 100);

          updatePipelineStep(stepId, (step) => ({
            ...step,
            status: localProgress >= 100 ? "completed" : "running",
            progress: localProgress,
          }));

          setProcessingProgress((value) => Math.min(value + 6, 100));

          if (localProgress < 100) {
            return;
          }

          clearTimer(processingTimerRef);
          onDone();
        }, intervalMs);
      };

      const runSpeakerSummaryAndMinutes = (
        segments: TranscriptSegment[],
        rawTranscriptText: string,
      ) => {
        updatePipelineStep("speaker_summary", (step) => ({
          ...step,
          status: "running",
          progress: 0,
        }));

        let summaryProgress = 0;
        const speakerSummaryTimer = setInterval(() => {
          if (processingRunIdRef.current !== runId) {
            clearInterval(speakerSummaryTimer);
            return;
          }

          summaryProgress = Math.min(summaryProgress + 8, 92);
          updatePipelineStep("speaker_summary", (step) => ({
            ...step,
            status: "running",
            progress: summaryProgress,
          }));
          setProcessingProgress((value) => Math.min(value + 4, 96));
        }, 240);

        void (async () => {
          let summaries: SpeakerSummary[] = buildSpeakerSummariesFromSegments(
            segments,
            sourceMeeting.speakerSummaries,
          );
          let nextMinutes = "Không có biên bản từ API cho phiên hiện tại.";
          let nextMailTemplate: MeetingMailTemplate | undefined;

          setNotice("Đang tạo tóm tắt ý chính theo từng người...");

          try {
            const transcriptLinesForChat = segments.length
              ? segments.map(
                  (segment) =>
                    `${segment.speaker} (${segment.startSecond}s - ${segment.endSecond}s): ${segment.text}`,
                )
              : rawTranscriptText
                  .split("\n")
                  .map((line) => cleanTranscriptLine(line))
                  .filter((line) => line.length > 0);

            const combinedResult = await summaryMinutesMutation.mutateAsync({
              transcriptLines: transcriptLinesForChat,
              model: "qwen3.5-flash-2026-02-23",
            });

            summaries =
              combinedResult.speakerSummaries.length > 0
                ? combinedResult.speakerSummaries
                : summaries;
            nextMinutes =
              combinedResult.minutesMarkdown.trim() ||
              "Không có biên bản từ API cho phiên hiện tại.";
            nextMailTemplate = combinedResult.mailTemplate;
          } catch (error) {
            clearInterval(speakerSummaryTimer);
            markPipelineAsError(
              `Lỗi tạo tóm tắt theo người nói: ${error instanceof Error ? error.message : String(error)}`,
              "speaker_summary",
            );
            return;
          }

          if (processingRunIdRef.current !== runId) {
            clearInterval(speakerSummaryTimer);
            return;
          }

          clearInterval(speakerSummaryTimer);
          updatePipelineStep("speaker_summary", (step) => ({
            ...step,
            status: "completed",
            progress: 100,
          }));

          setActiveMeeting((current) => ({
            ...current,
            speakerSummaries: summaries,
          }));
          setNotice("Đã có tóm tắt theo từng người, đang tạo biên bản...");

          updatePipelineStep("minutes", (step) => ({
            ...step,
            status: "running",
            progress: 15,
          }));

          let minutesProgress = 15;
          const minutesTimer = setInterval(() => {
            if (processingRunIdRef.current !== runId) {
              clearInterval(minutesTimer);
              return;
            }

            minutesProgress = Math.min(minutesProgress + 17, 100);
            updatePipelineStep("minutes", (step) => ({
              ...step,
              status: minutesProgress >= 100 ? "completed" : "running",
              progress: minutesProgress,
            }));
            setProcessingProgress((value) =>
              Math.min(value + (minutesProgress >= 100 ? 4 : 2), 100),
            );

            if (minutesProgress < 100) {
              return;
            }

            clearInterval(minutesTimer);
            setProcessingProgress(100);

            setActiveMeeting((current) => ({
              ...current,
              processingStatus: "completed",
              durationSecond: Math.max(durationSecond, 30),
              minutes: nextMinutes,
              mailTemplate: nextMailTemplate,
            }));
            setMinutesDraft(nextMinutes);
            setNotice("Xử lý hoàn tất. Biên bản đã được tạo từ API.");
          }, 120);
        })();
      };

      const runDiarizationStep = (
        segments: TranscriptSegment[],
        speakerCount: number,
        rawTranscriptText: string,
      ) => {
        runPipelineStep("diarization", 20, 250, () => {
          if (processingRunIdRef.current !== runId) {
            return;
          }

          const safeSegments = segments.length
            ? segments
            : sourceMeeting.segments;
          const safeSpeakerCount =
            speakerCount > 0
              ? speakerCount
              : new Set(safeSegments.map((segment) => segment.speaker)).size;

          setActiveMeeting((current) => ({
            ...current,
            segments: safeSegments,
            speakerCount: safeSpeakerCount,
          }));
          setNotice("Đã tách theo người nói, đang tạo biên bản...");
          runSpeakerSummaryAndMinutes(safeSegments, rawTranscriptText);
        });
      };

      setNotice("Đang chuyển file ghi âm thành văn bản...");
      updatePipelineStep("raw_transcript", (step) => ({
        ...step,
        status: "running",
        progress: 8,
      }));

      let rawStepProgress = 8;
      const rawStepTimer = setInterval(() => {
        if (processingRunIdRef.current !== runId) {
          clearInterval(rawStepTimer);
          return;
        }

        rawStepProgress = Math.min(rawStepProgress + 9, 92);
        updatePipelineStep("raw_transcript", (step) => ({
          ...step,
          status: "running",
          progress: rawStepProgress,
        }));
      }, 240);

      void (async () => {
        try {
          const apiResult = await diarizeTranscribeMutation.mutateAsync({
            file: sourceAudioFile,
            language: "Vietnamese",
          });

          const transcriptLines = apiResult.rawTranscription
            .map((line) => cleanTranscriptLine(line))
            .filter((line) => line.length > 0);
          const refinedTranscriptLines = apiResult.refinedTranscription
            .map((line) => cleanTranscriptLine(line))
            .filter((line) => line.length > 0);
          const parsedSegments = parseTranscriptSegments(transcriptLines);
          const speakerCount = deriveSpeakerCount(
            transcriptLines,
            parsedSegments,
          );
          const mergedTranscript = transcriptLines.join("\n");
          const mergedRefinedTranscript = refinedTranscriptLines.join("\n");

          clearInterval(rawStepTimer);

          updatePipelineStep("raw_transcript", (step) => ({
            ...step,
            status: "completed",
            progress: 100,
          }));
          setProcessingProgress((value) => Math.min(value + 20, 100));

          setActiveMeeting((current) => ({
            ...current,
            rawTranscript:
              mergedTranscript ||
              "Không có transcript text từ API cho phiên hiện tại.",
            refinedTranscript:
              mergedRefinedTranscript ||
              mergedTranscript ||
              "Không có bản refined từ API cho phiên hiện tại.",
            speakerCount,
            durationSecond: Math.max(durationSecond, current.durationSecond),
            audioUrl: apiResult.audioUrl,
            apiRecordId: apiResult.id,
          }));

          setNotice(
            "Đã có nội dung chữ, đang tách hội thoại theo từng người...",
          );
          runDiarizationStep(parsedSegments, speakerCount, mergedTranscript);
        } catch (error) {
          clearInterval(rawStepTimer);

          if (processingRunIdRef.current !== runId) {
            return;
          }

          const message =
            error instanceof Error
              ? error.message
              : "Không thể gọi API diarize/transcribe.";

          markPipelineAsError(
            `Lỗi tạo transcript thô: ${message}`,
            "raw_transcript",
          );
        }
      })();
    }, 1);
  }

  function retryPipeline({
    busyProcessing,
    activeMeeting,
    selectedFile,
    selectedFileName,
    selectedFileDurationSecond,
    recordingFile,
    recordingSecond,
  }: RetryPipelineArgs) {
    if (!failedStepId || busyProcessing) {
      return;
    }

    const source = activeMeeting.inputSource;

    if (source === "upload") {
      if (!selectedFile) {
        setNotice("Không tìm thấy tệp upload hiện tại để thử lại pipeline.");
        return;
      }

      const retryFileName = selectedFileName ?? selectedFile.name;
      const retryDuration =
        selectedFileDurationSecond ?? Math.max(activeMeeting.durationSecond, 1);

      setNotice("Đang thử lại pipeline từ đầu...");
      startProcessing({
        source: "upload",
        fileName: retryFileName,
        durationSecond: retryDuration,
        sourceAudioFile: selectedFile,
      });
      return;
    }

    if (!recordingFile) {
      setNotice("Không tìm thấy bản thu hiện tại để thử lại pipeline.");
      return;
    }

    const retryDuration = Math.max(
      recordingSecond || activeMeeting.durationSecond,
      1,
    );

    setNotice("Đang thử lại pipeline từ đầu...");
    startProcessing({
      source: "recording",
      fileName: recordingFile.name,
      durationSecond: retryDuration,
      sourceAudioFile: recordingFile,
    });
  }

  useEffect(() => {
    return () => {
      processingRunIdRef.current += 1;
      clearTimer(uploadTimerRef);
      clearTimer(processingTimerRef);
    };
  }, []);

  return {
    pipelineSteps,
    failedStepId,
    resetPipelineSteps,
    setFailedStepId,
    startProcessing,
    retryPipeline,
  };
}
