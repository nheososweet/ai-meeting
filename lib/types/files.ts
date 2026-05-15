// ══════════════════════════════════════════════════════════
// Files — TypeScript Interfaces
// ══════════════════════════════════════════════════════════

/** API Response types (upstream snake_case) */
export interface UpstreamFileRecord {
  id: number;
  create_time: string;
  uploader_id: number;
  uploaded_by?: { id: number; name: string } | null;
  assigned_to_users: { id: number; name: string }[];
  assigned_to_groups: { id: number; name: string }[];
  assigned_to_companies: { id: number; name: string }[];
  assigned_by_user: { id: number; name: string } | null;
  company_id: number | null;
  group_id: number | null;
  s3_key: string;
  audio_url: string;
  transcribe_url: string | null;
  report: string | null;
  filename: string;
  title: string;
  file_status: {
    report: string;
    upload: string;
    summary: string;
    send_email: string;
    transcribe: string;
  };
  processed_at: string | null;
  size?: number;
  duration?: number;
}

/** Frontend normalized types (camelCase) */
export type FileRecordStatus = "uploaded" | "pending" | "processing" | "completed" | "failed";

export interface FileRecord {
  id: number;
  createTime: string;
  uploaderId: number;
  uploadedBy?: { id: number; name: string } | null;
  assignedToUsers: { id: number; name: string }[];
  assignedToGroups: { id: number; name: string }[];
  assignedToCompanies: { id: number; name: string }[];
  assignedByUser: { id: number; name: string } | null;
  companyId: number | null;
  groupId: number | null;
  s3Key: string;
  audioUrl: string;
  transcribeUrl: string | null;
  report: string | null;
  filename: string;
  title: string;
  status: FileRecordStatus;
  fileStatus: {
    report: string;
    upload: string;
    summary: string;
    sendEmail: string;
    transcribe: string;
  };
  processedAt: string | null;
  size?: number;
  duration?: number;
}

export interface FileUploadResponse {
  status: string;
  file: UpstreamFileRecord;
}

/** Filter params for GET /files */
export interface FilesQueryParams {
  page?: number;
  page_size?: number;
  status_step?: string | null;
  status_value?: string | null;
  status_filter?: FileRecordStatus | string | null;
  search?: string | null;
  assigned_filter?: boolean | null;
  self_upload?: boolean | null;
}
