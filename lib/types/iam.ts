// ══════════════════════════════════════════════════════════
// IAM — TypeScript Interfaces
// ══════════════════════════════════════════════════════════

// === Legacy IAM types (kept for IAM management pages) ===

export type UserStatus = "active" | "locked"

export interface IamUser {
  id: string
  name: string
  email: string
  status: UserStatus
  createdAt: string
  roleIds: string[]
  groupIds: string[]
}

export interface IamRole {
  id: string
  name: string
  description: string
  permissionIds: string[]
}

export interface IamPermission {
  id: string
  code: string
  label: string
  parentId: string | null
  children?: IamPermission[]
}

export interface IamGroup {
  id: string
  name: string
  description: string
  parentId: string | null
  children?: IamGroup[]
  memberIds: string[]
  roleIds: string[]
}

export interface Company {
  id: number
  name: string
  permissions?: string[]
  created_at?: string
  created_by?: number
}

export interface Group {
  id: number
  name: string
  company_id: number
  parent_id?: number | null
  permissions?: string[]
  created_at?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    page_size: number
    total_items: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

// ══════════════════════════════════════════════════════════
// Auth API — Real Backend Types
// ══════════════════════════════════════════════════════════

export type UserRole = "admin" | "member"
export type UserScope = "global" | "company" | "group"

/** Response từ POST /auth/login */
export interface LoginResponse {
  access_token: string
  token_type: string // "bearer"
}

/** Response từ GET /auth/me */
export interface AuthMeResponse {
  id: number
  name: string
  email: string
  role_id?: number
  role: {
    id: number
    name: UserRole
  }
  scope: UserScope | null
  company_id: number | null
  group_id: number | null
  company?: Company | null
  group?: Group | null
  permissions: string[]
  is_active: boolean
  created_at?: string
}

// ══════════════════════════════════════════════════════════
// Permission Codes (from backend)
// ══════════════════════════════════════════════════════════

/** All permission codes returned by the backend */
export const PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  MANAGE_GROUPS: "manage_groups",
  MANAGE_ROLES: "manage_role",
  MANAGE_COMPANIES: "manage_companies",
  ASSIGN_PERMISSIONS: "assign_permissions",
  ASSIGN_FILES: "assign_files",
  TRANSCRIBE: "transcribe",
  UPDATE_REPORT: "update_report",
  SEND_MAIL: "send_mail",
  CHAT: "chat",
  VIEW_RECORDS: "view_records",
  TRANSLATE: "translate",
  PROCESS_PIPELINE: "process_pipeline",
} as const

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// ══════════════════════════════════════════════════════════
// Auth Context — Used across the app
// ══════════════════════════════════════════════════════════

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  scope: UserScope | null
  companyId: number | null
  groupId: number | null
  company?: Company | null
  group?: Group | null
  permissions: string[]
  isActive: boolean
}

export interface AuthContextValue {
  currentUser: AuthUser | null
  isLoading: boolean
  isFetching: boolean
  isAuthenticated: boolean
  hasPermission: (code: string) => boolean
  hasAnyPermission: (codes: string[]) => boolean
  hasRole: (role: UserRole) => boolean
  hasScope: (scope: UserScope) => boolean
  logout: () => Promise<void>
}
