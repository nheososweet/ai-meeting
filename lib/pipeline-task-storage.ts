import type { TranscriptSegment } from "@/lib/types/meeting";

const STORAGE_KEY = "meeting_pipeline_task";
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 giờ

export interface StoredPipelineTask {
  taskId: string;
  step: "raw_transcript" | "speaker_summary";
  pipelineRunId: string;
  savedAt: number;
  fileName: string;
  source: string;
  fileId?: number;
  durationSecond: number;
  step1Result?: {
    apiRecordId: number;
    rawTranscript: string;
    refinedTranscript: string;
    audioUrl?: string;
    segments: TranscriptSegment[];
    speakerCount: number;
  };
}

export function saveTaskToStorage(task: StoredPipelineTask): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(task));
  } catch {
    // Bỏ qua lỗi localStorage (private mode, quota exceeded, ...)
  }
}

export function loadTaskFromStorage(): StoredPipelineTask | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const task = JSON.parse(raw) as StoredPipelineTask;
    if (!task.taskId || !task.step || !task.pipelineRunId) return null;
    if (Date.now() - task.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return task;
  } catch {
    return null;
  }
}

export function clearTaskFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // bỏ qua
  }
}
