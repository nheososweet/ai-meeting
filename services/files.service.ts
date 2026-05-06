import { pipelineApi } from "@/services/pipeline-api";
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
    assignedToUserIds: record.assigned_to_user_ids,
    assignedToGroupIds: record.assigned_to_group_ids,
    assignedToCompanyIds: record.assigned_to_company_ids,
    companyId: record.company_id,
    groupId: record.group_id,
    s3Key: record.s3_key,
    audioUrl: record.audio_url,
    transcribeUrl: record.transcribe_url,
    report: record.report,
    filename: record.filename,
    title: record.title,
    status: record.status as FileRecordStatus,
    processedAt: record.processed_at,
  };
}

export const filesService = {
  /**
   * Fetch list of files with optional filters and pagination
   */
  getFiles: async (params?: FilesQueryParams): Promise<PaginatedResponse<FileRecord>> => {
    const response = await pipelineApi.get<PaginatedResponse<UpstreamFileRecord>>("/files", {
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
