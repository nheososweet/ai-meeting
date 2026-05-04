// ══════════════════════════════════════════════════════════
// WBS / Media Management — TypeScript Interfaces
// ══════════════════════════════════════════════════════════

// === Project / Campaign ===
export type ProjectType = "project" | "campaign"
export type ProjectStatus = "active" | "archived" | "draft"

export interface WbsProject {
  id: string
  name: string
  description: string
  type: ProjectType
  status: ProjectStatus
  createdAt: string
  createdBy: string // user ID
}

// === Assignment / Job ===
export type JobStatus = "pending" | "in_progress" | "review" | "done"

export interface StatusChange {
  from: JobStatus
  to: JobStatus
  changedBy: string // user ID
  changedAt: string
  note?: string
}

export interface WbsAssignment {
  id: string
  projectId: string
  name: string
  assigneeIds: string[] // User/Group IDs
  status: JobStatus
  deadline: string
  createdAt: string
  statusHistory: StatusChange[]
}

// === File Management ===
export interface WbsFile {
  id: string
  projectId: string
  name: string
  size: number // bytes
  mimeType: string
  uploadedBy: string // user ID
  uploadedAt: string
  s3Key: string
}

// === Folder Permission ===
export type FolderPermissionType = "read" | "write" | "delete"
export type PermissionTargetType = "user" | "group"

export interface FolderPermission {
  id: string
  folderId: string
  folderName: string
  targetType: PermissionTargetType
  targetId: string // user ID or group ID
  permissions: FolderPermissionType[]
}
