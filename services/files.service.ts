import { api, pipelineApi } from "@/services/pipeline-api";
import { type PaginatedResponse } from "@/lib/types/iam";
import {
  type UpstreamFileRecord,
  type FileRecord,
  type FileUploadResponse,
  type FilesQueryParams,
  type FileRecordStatus,
  type FileHistoryResponse,
  type UpstreamMyHistoryRecord,
  type MyHistoryRecord,
  type MyHistoryQueryParams,
  type MyUploadsQueryParams,
} from "@/lib/types/files";

/**
 * Normalize snake_case UpstreamFileRecord to camelCase FileRecord
 */
function normalizeFileRecord(record: UpstreamFileRecord): FileRecord {
  return {
    id: record.id,
    createTime: record.create_time,
    uploaderId: record.uploader_id,
    uploadedBy: record.uploaded_by || null,
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
    isSelfUpload: record.is_self_upload ?? false,
  };
}

function normalizeMyHistoryRecord(r: UpstreamMyHistoryRecord): MyHistoryRecord {
  return {
    historyId: r.history_id ?? r.file_id,
    fileId: r.file_id,
    filename: r.filename,
    title: r.title,
    createTime: r.create_time,
    userType: r.user_type ?? "assignee",
    transcribeUrl: r.transcribe_url,
    report: r.report,
    processedAt: r.processed_at,
    stepStatus: {
      report: r.step_status?.report ?? "waiting",
      summary: r.step_status?.summary ?? "waiting",
      sendEmail: r.step_status?.send_email ?? "waiting",
      transcribe: r.step_status?.transcribe ?? "waiting",
    },
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
   * Fetch a single file record by ID (used for background task polling)
   */
  getFileById: async (id: number): Promise<FileRecord> => {
    const response = await api.get<UpstreamFileRecord>(`/files/${id}`);
    return normalizeFileRecord(response.data);
  },

  /**
   * Fetch processing history for a file (uploader + assignees)
   */
  getFileHistory: async (fileId: number): Promise<FileHistoryResponse> => {
    const response = await api.get<FileHistoryResponse>(`/files/${fileId}/history`);
    return response.data;
  },

  /**
   * Fetch processing history for the current user (assigned files)
   */
  getMyHistory: async (params?: MyHistoryQueryParams): Promise<PaginatedResponse<MyHistoryRecord>> => {
    const response = await api.get<PaginatedResponse<UpstreamMyHistoryRecord>>("/files/my-history", { params });
    return {
      data: response.data.data.map(normalizeMyHistoryRecord),
      meta: response.data.meta,
    };
  },

  /**
   * Fetch files uploaded by the current user
   */
  getMyUploads: async (params?: MyUploadsQueryParams): Promise<PaginatedResponse<FileRecord>> => {
    const response = await api.get<PaginatedResponse<UpstreamFileRecord>>("/files/my-uploads", { params });
    return {
      data: response.data.data.map(normalizeFileRecord),
      meta: response.data.meta,
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
