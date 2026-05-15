export type BackgroundTaskType =
  | "upload_file"
  | "meeting_pipeline"

export type PipelineStepStatus = "waiting" | "processing" | "success" | "failed"

export interface UploadPipelineSteps {
  upload: PipelineStepStatus
  transcribe: PipelineStepStatus
  summary: PipelineStepStatus
  report: PipelineStepStatus
  sendEmail: PipelineStepStatus
}

export interface MeetingPipelineSteps {
  raw_transcript:  PipelineStepStatus
  diarization:     PipelineStepStatus
  speaker_summary: PipelineStepStatus
  minutes:         PipelineStepStatus
}

// Union type cho steps — mở rộng khi có loại task mới
export type TaskSteps = UploadPipelineSteps | MeetingPipelineSteps

export type BackgroundTaskStatus = "running" | "polling" | "completed" | "failed"

export interface BackgroundTaskItem {
  id: string
  type: BackgroundTaskType
  label: string
  status: BackgroundTaskStatus
  progress: number                 // 0–100
  steps?: TaskSteps
  errorMessage?: string
  createdAt: number
  completedAt?: number
  meta?: Record<string, unknown>   // payload tuỳ chỉnh theo loại task
}
