// ══════════════════════════════════════════════════════════
// IAM — TypeScript Interfaces
// ══════════════════════════════════════════════════════════

// === User ===
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

// === Role ===
export interface IamRole {
  id: string
  name: string
  description: string
  permissionIds: string[]
}

// === Permission (Tree node) ===
export interface IamPermission {
  id: string
  code: string
  label: string
  parentId: string | null
  children?: IamPermission[]
}

// === Group (Tree structure) ===
export interface IamGroup {
  id: string
  name: string
  description: string
  parentId: string | null
  children?: IamGroup[]
  memberIds: string[]
  roleIds: string[]
}

// === Auth Context ===
export interface AuthUser {
  id: string
  name: string
  email: string
  roles: IamRole[]
  effectivePermissions: string[]
}

export interface AuthContextValue {
  currentUser: AuthUser
  hasPermission: (code: string) => boolean
  hasAnyPermission: (codes: string[]) => boolean
  hasRole: (roleName: string) => boolean
  switchMockRole: (preset: string) => void
}
