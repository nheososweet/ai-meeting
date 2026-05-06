// ══════════════════════════════════════════════════════════
// Files — TypeScript Interfaces
// ══════════════════════════════════════════════════════════

/** API Response types (upstream snake_case) */
export interface UpstreamFileRecord {
  id: number;
  create_time: string;
  uploader_id: number;
  assigned_to_user_ids: number[];
  assigned_to_group_ids: number[];
  assigned_to_company_ids: number[];
  company_id: number | null;
  group_id: number | null;
  s3_key: string;
  audio_url: string;
  transcribe_url: string | null;
  report: string | null;
  filename: string;
  title: string;
  status: string;
  processed_at: string | null;
}

/** Frontend normalized types (camelCase) */
export type FileRecordStatus = "uploaded" | "pending" | "processing" | "completed" | "failed";

export interface FileRecord {
  id: number;
  createTime: string;
  uploaderId: number;
  assignedToUserIds: number[];
  assignedToGroupIds: number[];
  assignedToCompanyIds: number[];
  companyId: number | null;
  groupId: number | null;
  s3Key: string;
  audioUrl: string;
  transcribeUrl: string | null;
  report: string | null;
  filename: string;
  title: string;
  status: FileRecordStatus;
  processedAt: string | null;
}

export interface FileUploadResponse {
  status: string;
  file: UpstreamFileRecord;
}

/** Filter params for GET /files */
export interface FilesQueryParams {
  page?: number;
  page_size?: number;
  status_filter?: FileRecordStatus | string | null;
  search?: string | null;
}
