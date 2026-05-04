"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import type { AuthContextValue, AuthUser } from "@/lib/types/iam"
import { mockUsers, mockRoles, mockGroups, mockPermissions, resolveEffectivePermissions } from "@/lib/mock/iam"

// ══════════════════════════════════════════════════════════
// Build AuthUser from a mock user ID
// ══════════════════════════════════════════════════════════

function buildAuthUser(userId: string): AuthUser {
  const user = mockUsers.find((u) => u.id === userId)
  if (!user) {
    // Fallback: return a minimal viewer
    return {
      id: "user-unknown",
      name: "Unknown",
      email: "unknown@vpcp.gov.vn",
      roles: [],
      effectivePermissions: [],
    }
  }

  const userRoles = mockRoles.filter((r) => user.roleIds.includes(r.id))
  const effectivePermissions = resolveEffectivePermissions(user, mockRoles, mockGroups, mockPermissions)

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: userRoles,
    effectivePermissions,
  }
}

// Role preset → user ID mapping (for dev switcher)
const ROLE_USER_MAP: Record<string, string> = {
  Admin: "user-1",       // Nguyễn Văn An — role-admin
  Supervisor: "user-4",  // Phạm Minh Đức — role-supervisor
  Editor: "user-2",      // Trần Thị Bích — role-editor
  Viewer: "user-3",      // Lê Hoàng Cường — role-viewer
}

// ══════════════════════════════════════════════════════════
// Context
// ══════════════════════════════════════════════════════════

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Default: login as Admin for development
  const [currentUserId, setCurrentUserId] = useState("user-1")

  const currentUser = useMemo(() => buildAuthUser(currentUserId), [currentUserId])

  const hasPermission = useCallback(
    (code: string) => currentUser.effectivePermissions.includes(code),
    [currentUser.effectivePermissions],
  )

  const hasAnyPermission = useCallback(
    (codes: string[]) => codes.some((c) => currentUser.effectivePermissions.includes(c)),
    [currentUser.effectivePermissions],
  )

  const hasRole = useCallback(
    (roleName: string) => currentUser.roles.some((r) => r.name === roleName),
    [currentUser.roles],
  )

  const switchMockRole = useCallback((preset: string) => {
    const userId = ROLE_USER_MAP[preset]
    if (userId) setCurrentUserId(userId)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ currentUser, hasPermission, hasAnyPermission, hasRole, switchMockRole }),
    [currentUser, hasPermission, hasAnyPermission, hasRole, switchMockRole],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>")
  }
  return ctx
}
