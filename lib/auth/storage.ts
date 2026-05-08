// ══════════════════════════════════════════════════════════
// Client-side Token Storage (localStorage + Cookie)
// ══════════════════════════════════════════════════════════

import type { AuthUser } from "@/lib/types/iam"

const TOKEN_KEY = "access_token"
const AUTH_USER_KEY = "auth_user"

/** 
 * Save token to localStorage (for axios) AND cookie (for Next.js proxy.ts) 
 */
export function setTokenInStorage(token: string): void {
  if (typeof window !== "undefined") {
    // 1. For client-side API requests (Axios interceptor)
    localStorage.setItem(TOKEN_KEY, token)

    // 2. For server-side route protection (proxy.ts)
    // Note: We use JS cookie so proxy.ts can read it on next page load.
    // 86400 seconds = 1 day
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400; samesite=lax`
  }
}

/** Read token from localStorage (client-side) */
export function getTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

/** Remove token, user cache from localStorage, and cookie */
export function clearTokenFromStorage(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`
  }
}

// ══════════════════════════════════════════════════════════
// Cached AuthUser (localStorage) — for instant hydration on refresh
// ══════════════════════════════════════════════════════════

/** Read cached AuthUser from localStorage */
export function getCachedAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

/** Save AuthUser to localStorage for instant hydration on next refresh */
export function setCachedAuthUser(user: AuthUser): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  } catch { /* ignore quota errors */ }
}
