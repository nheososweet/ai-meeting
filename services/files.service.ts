import { api, pipelineApi } from "@/services/pipeline-api";
import { type PaginatedResponse } from "@/lib/types/iam";
import {
  type UpstreamFileRecord,
  type FileRecord,
  type FileUploadResponse,
  type FilesQueryParams,
  type FileRecordStatus,
} from "@/lib/types/files";

/**
 * Normalize snake_case UpstreamFileRecord to camelCase FileRecord
 */
function normalizeFileRecord(record: UpstreamFileRecord): FileRecord {
  return {
    id: record.id,
    createTime: record.create_time,
    uploaderId: record.uploader_id,
    assignedToUsers: record.assigned_to_users || [],
    assignedToGroups: record.assigned_to_groups || [],
    assignedToCompanies: record.assigned_to_companies || [],
    assignedByUser: record.assigned_by_user,
    companyId: record.company_id,
    groupId: record.group_id,
    s3Key: record.s3_key,
    audioUrl: record.audio_url,
    transcribeUrl: record.transcribe_url,
    report: record.report,
    filename: record.filename,
    title: record.title,
    fileStatus: {
      report: record.file_status.report,
      upload: record.file_status.upload,
      summary: record.file_status.summary,
      sendEmail: record.file_status.send_email,
      transcribe: record.file_status.transcribe,
    },
    // Derive a top-level status for the UI badge based on transcription/report status
    status: (record.file_status.report === "success" 
      ? "completed" 
      : record.file_status.upload === "success" 
        ? "processing" 
        : "pending") as FileRecordStatus,
    processedAt: record.processed_at,
    size: record.size,
    duration: record.duration,
  };
}

export const filesService = {
  /**
   * Fetch list of files with optional filters and pagination
   */
  getFiles: async (params?: FilesQueryParams): Promise<PaginatedResponse<FileRecord>> => {
    const response = await api.get<PaginatedResponse<UpstreamFileRecord>>("/files", {
      params,
    });

    const payload = response.data;

    return {
      data: payload.data.map(normalizeFileRecord),
      meta: payload.meta,
    };
  },

  /**
   * Upload a new file
   */
  uploadFile: async (file: File, title: string): Promise<FileRecord> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    const response = await pipelineApi.post<FileUploadResponse>("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return normalizeFileRecord(response.data.file);
  },
};
