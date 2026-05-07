"use client"

// ══════════════════════════════════════════════════════════
// Auth Context — Real API Integration
// ══════════════════════════════════════════════════════════

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  AuthContextValue,
  AuthUser,
  AuthMeResponse,
  UserRole,
  UserScope,
} from "@/lib/types/iam"
import {
  getTokenFromStorage,
  clearTokenFromStorage,
  getCachedAuthUser,
  setCachedAuthUser,
} from "@/lib/auth/storage"
import { authService } from "@/services/auth.service"

// ── Map API response → AuthUser ─────────────────────────

export function mapAuthUser(data: AuthMeResponse): AuthUser {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role.name,
    scope: data.scope,
    companyId: data.company_id,
    groupId: data.group_id,
    company: data.company,
    group: data.group,
    permissions: data.permissions,
    isActive: data.is_active,
  }
}

// ── Fetch user via Axios (direct backend) ─────────────────

async function fetchMe(): Promise<AuthUser> {
  const data = await authService.getMe()
  return mapAuthUser(data)
}

// ══════════════════════════════════════════════════════════
// Context
// ══════════════════════════════════════════════════════════

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  // Check if we have a token in localStorage before querying
  const hasToken =
    typeof window !== "undefined" && !!getTokenFromStorage()

  // Read cached user from localStorage for instant hydration on refresh
  const cachedUser = hasToken ? getCachedAuthUser() : null

  const {
    data: currentUser = null,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 0, // Always consider stale to trigger background sync on mount (F5)
    refetchOnWindowFocus: true, // Sync data when user returns to the tab
    enabled: hasToken, // Only fetch if token exists
    initialData: cachedUser ?? undefined,
    // No initialDataUpdatedAt → data is immediately stale → background refetch
  })

  // Sync user data back to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      setCachedAuthUser(currentUser)
    }
  }, [currentUser])

  // If query fails with auth error, clear token and redirect
  useEffect(() => {
    if (error && hasToken) {
      clearTokenFromStorage()
      // Don't redirect if already on login page
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login"
      }
    }
  }, [error, hasToken])

  const isAuthenticated = !!currentUser

  const hasPermission = useCallback(
    (code: string) => currentUser?.permissions.includes(code) ?? false,
    [currentUser?.permissions],
  )

  const hasAnyPermission = useCallback(
    (codes: string[]) =>
      codes.some((c) => currentUser?.permissions.includes(c) ?? false),
    [currentUser?.permissions],
  )

  const hasRole = useCallback(
    (role: UserRole) => currentUser?.role === role,
    [currentUser?.role],
  )

  const hasScope = useCallback(
    (scope: UserScope) => currentUser?.scope === scope,
    [currentUser?.scope],
  )

  const logout = useCallback(async () => {
    try {
      // Call API to invalidate token on the backend
      await authService.logout()
    } catch (err) {
      console.warn("Logout API failed, proceeding with local cleanup", err)
    } finally {
      // Clear token + cached user from localStorage + cookie
      clearTokenFromStorage()
      // Clear React Query cache
      queryClient.clear()
      // Redirect to login
      window.location.href = "/login"
    }
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isLoading,
      isFetching,
      isAuthenticated,
      hasPermission,
      hasAnyPermission,
      hasRole,
      hasScope,
      logout,
    }),
    [
      currentUser,
      isLoading,
      isFetching,
      isAuthenticated,
      hasPermission,
      hasAnyPermission,
      hasRole,
      hasScope,
      logout,
    ],
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
