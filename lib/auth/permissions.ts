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
  PERMISSIONS.ASSIGN_PERMISSIONS,
]

/** Permissions required per IAM sub-route */
export const IAM_ROUTE_PERMISSIONS: Record<string, string> = {
  "/iam/users": PERMISSIONS.MANAGE_USERS,
  "/iam/groups": PERMISSIONS.MANAGE_GROUPS,
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
  PERMISSIONS.TRANSCRIBE,
  PERMISSIONS.UPDATE_REPORT,
  PERMISSIONS.SEND_MAIL,
  PERMISSIONS.CHAT,
]

/** Permissions related to history/records */
export const HISTORY_PERMISSIONS: string[] = [
  PERMISSIONS.VIEW_RECORDS,
]



