export const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;

export const ACCEPTED_AUDIO_MIME_TYPES = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/mp3",
  "audio/mpeg",
  "audio/webm",
  "audio/ogg",
]);

export const ACCEPTED_AUDIO_EXTENSIONS = new Set([
  "wav",
  "mp3",
  "mpeg",
  "webm",
  "ogg",
]);

export type PipelineStepStatus = "pending" | "running" | "completed" | "error";

export type PipelineStepId =
  | "raw_transcript"
  | "diarization"
  | "speaker_summary"
  | "minutes";

export type PipelineStep = {
  id: PipelineStepId;
  title: string;
  description: string;
  status: PipelineStepStatus;
  progress: number;
};

export const PIPELINE_STEP_BLUEPRINT: Array<
  Omit<PipelineStep, "status" | "progress">
> = [
  {
    id: "raw_transcript",
    title: "1) Chuyển giọng nói thành văn bản",
    description: "Hệ thống nghe toàn bộ bản ghi và chuyển thành nội dung chữ.",
  },
  {
    id: "diarization",
    title: "2) Phân chia theo từng người",
    description: "Nhận diện ai đang nói và tách thành từng đoạn hội thoại.",
  },
  {
    id: "speaker_summary",
    title: "3) Tóm tắt theo từng người",
    description: "Rút gọn các ý chính mà mỗi người đã trao đổi.",
  },
  {
    id: "minutes",
    title: "4) Tạo biên bản cuộc họp",
    description: "Tổng hợp nội dung thành biên bản dễ theo dõi.",
  },
];

export const PIPELINE_STEP_WEIGHT: Record<PipelineStepId, number> = {
  raw_transcript: 35,
  diarization: 20,
  speaker_summary: 25,
  minutes: 20,
};

export function createInitialPipelineSteps(): PipelineStep[] {
  return PIPELINE_STEP_BLUEPRINT.map((step) => ({
    ...step,
    status: "pending",
    progress: 0,
  }));
}
