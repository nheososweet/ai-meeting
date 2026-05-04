// ══════════════════════════════════════════════════════════
// IAM — Permission Code Constants & Helpers
// ══════════════════════════════════════════════════════════

/** All IAM permission codes used for UI guard */
export const IAM_PERMISSIONS = {
  // Users
  USERS_VIEW: "iam.users.view",
  USERS_CREATE: "iam.users.create",
  USERS_EDIT: "iam.users.edit",
  USERS_LOCK: "iam.users.lock",

  // Roles
  ROLES_VIEW: "iam.roles.view",
  ROLES_MANAGE: "iam.roles.manage",

  // Groups
  GROUPS_VIEW: "iam.groups.view",
  GROUPS_MANAGE: "iam.groups.manage",
} as const

export type IamPermissionCode =
  (typeof IAM_PERMISSIONS)[keyof typeof IAM_PERMISSIONS]

/** All WBS permission codes used for UI guard */
export const WBS_PERMISSIONS = {
  // Projects
  PROJECTS_VIEW: "wbs.projects.view",
  PROJECTS_MANAGE: "wbs.projects.manage",

  // Assignments
  ASSIGNMENTS_VIEW: "wbs.assignments.view",
  ASSIGNMENTS_MANAGE: "wbs.assignments.manage",

  // Files
  FILES_VIEW: "wbs.files.view",
  FILES_UPLOAD: "wbs.files.upload",
  FILES_DELETE: "wbs.files.delete",

  // Storage Permissions
  STORAGE_VIEW: "wbs.storage.view",
  STORAGE_MANAGE: "wbs.storage.manage",
} as const

export type WbsPermissionCode =
  (typeof WBS_PERMISSIONS)[keyof typeof WBS_PERMISSIONS]

/** Permissions required to see the IAM sidebar menu */
export const IAM_SIDEBAR_PERMISSIONS: IamPermissionCode[] = [
  IAM_PERMISSIONS.USERS_VIEW,
  IAM_PERMISSIONS.ROLES_VIEW,
  IAM_PERMISSIONS.GROUPS_VIEW,
]

/** Permissions required to see the WBS sidebar menu */
export const WBS_SIDEBAR_PERMISSIONS: WbsPermissionCode[] = [
  WBS_PERMISSIONS.PROJECTS_VIEW,
  WBS_PERMISSIONS.ASSIGNMENTS_VIEW,
  WBS_PERMISSIONS.FILES_VIEW,
]

/** Permissions required per IAM sub-route */
export const IAM_ROUTE_PERMISSIONS: Record<string, IamPermissionCode> = {
  "/iam/users": IAM_PERMISSIONS.USERS_VIEW,
  "/iam/roles": IAM_PERMISSIONS.ROLES_VIEW,
  "/iam/groups": IAM_PERMISSIONS.GROUPS_VIEW,
}

/** Permissions required per WBS sub-route */
export const WBS_ROUTE_PERMISSIONS: Record<string, WbsPermissionCode> = {
  "/wbs/projects": WBS_PERMISSIONS.PROJECTS_VIEW,
  "/wbs/assignments": WBS_PERMISSIONS.ASSIGNMENTS_VIEW,
  "/wbs/files": WBS_PERMISSIONS.FILES_VIEW,
}

/** Role presets for dev switching */
export const ROLE_PRESETS = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
  supervisor: "Supervisor",
} as const
