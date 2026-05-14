// ══════════════════════════════════════════════════════════
// Permissions — Constants & Helpers
// Maps backend permission codes to UI guards
// ══════════════════════════════════════════════════════════

import { PERMISSIONS } from "@/lib/types/iam"

// Re-export for convenience
export { PERMISSIONS }

// ── IAM Sidebar / Route Guards ──────────────────────────

/** Permissions required to see the IAM sidebar menu */
export const IAM_SIDEBAR_PERMISSIONS: string[] = [
  PERMISSIONS.MANAGE_USERS,
  PERMISSIONS.MANAGE_GROUPS,
  PERMISSIONS.MANAGE_ROLES,
  PERMISSIONS.MANAGE_COMPANIES,
  PERMISSIONS.ASSIGN_PERMISSIONS,
]

/** Map permission codes to user-friendly Vietnamese labels */
export const PERMISSION_LABELS: Record<string, string> = {
  "manage_users": "Quản lý tài khoản người dùng",
  "manage_groups": "Quản lý phòng ban / nhóm",
  "manage_role": "Quản lý vai trò và quyền hạn",
  "manage_companies": "Quản lý tổ chức / công ty",
  "assign_permissions": "Gán quyền trực tiếp cho tài khoản",
  "assign_files": "Phân phối tệp tin biên dịch (WBS)",
  "transcribe": "Thực hiện gỡ băng / biên tập âm thanh",
  "translate": "Thực hiện dịch thuật bản ghi",
  "update_report": "Chỉnh sửa biên bản cuộc họp",
  "view_records": "Xem lịch sử cuộc họp",
  "send_mail": "Gửi báo cáo qua Email",
  "process_pipeline": "Xử lý file",
}

/** Group permissions for better UI organization */
export const PERMISSION_GROUPS = [
  {
    name: "Quản trị hệ thống",
    icon: "ShieldIcon",
    perms: ["manage_users", "manage_groups", "manage_role", "manage_companies", "assign_permissions"]
  },
  {
    name: "Nghiệp vụ",
    icon: "BriefcaseIcon",
    perms: ["assign_files", "process_pipeline", "translate", "view_records"]
  },
  {
    name: "Tiện ích",
    icon: "ZapIcon",
    perms: ["send_mail"]
  }
]

/** Permissions required per IAM sub-route */
export const IAM_ROUTE_PERMISSIONS: Record<string, string> = {
  "/iam/users": PERMISSIONS.MANAGE_USERS,
  "/iam/groups": PERMISSIONS.MANAGE_GROUPS,
  "/iam/roles": PERMISSIONS.MANAGE_ROLES,
}

// ── WBS Sidebar / Route Guards ──────────────────────────

/** Permissions required to see the WBS sidebar menu */
export const WBS_SIDEBAR_PERMISSIONS: string[] = [
  PERMISSIONS.ASSIGN_FILES,
]

/** Permissions required per WBS sub-route */
export const WBS_ROUTE_PERMISSIONS: Record<string, string> = {
  "/meeting-records": PERMISSIONS.ASSIGN_FILES,
  "/wbs/projects": PERMISSIONS.ASSIGN_FILES,
  "/wbs/assignments": PERMISSIONS.ASSIGN_FILES,
  "/wbs/files": PERMISSIONS.ASSIGN_FILES,
}

// ── Workspace / Pipeline Guards ─────────────────────────

/** Permissions related to the workspace/pipeline features */
export const WORKSPACE_PERMISSIONS: string[] = [
  PERMISSIONS.PROCESS_PIPELINE,
  PERMISSIONS.SEND_MAIL,
]

/** Permissions related to history/records */
export const HISTORY_PERMISSIONS: string[] = [
  PERMISSIONS.VIEW_RECORDS,
]



