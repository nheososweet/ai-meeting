"use client"

import { type ReactNode } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { AccessDenied403 } from "./access-denied"
import { Loader2Icon } from "lucide-react"
import Image from "next/image"

interface PermissionGuardProps {
  children: ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
}: PermissionGuardProps) {
  const { isLoading, isFetching, hasPermission, hasAnyPermission, isAuthenticated } = useAuth()

  // Helper to check access
  const checkAccess = () => {
    if (!isAuthenticated) return false
    
    if (permission) {
      return hasPermission(permission)
    } else if (permissions) {
      if (requireAll) {
        return permissions.every((p) => hasPermission(p))
      } else {
        return hasAnyPermission(permissions)
      }
    }
    return true
  }

  const hasAccess = checkAccess()

  // 1. Loading State (Prevent F5 flicker)
  // Show loading if:
  // - Initial fetch is in progress (isLoading)
  // - OR background refetch is active AND current (cached) user has NO access (wait for server confirmation)
  const showLoading = isLoading || (isFetching && !hasAccess)

  if (showLoading) {
    return (
      <div className="flex fixed inset-0 z-50 flex-col items-center justify-center bg-background animate-in fade-in duration-300">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative size-20">
            <Image
              src="/vpcp-ui/element/quoc_huy.png"
              alt="Loading"
              fill
              className="object-contain animate-pulse"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin text-primary" />
          <span className="text-sm font-medium tracking-wide uppercase opacity-70">
            Đang xác thực quyền truy cập...
          </span>
        </div>
      </div>
    )
  }

  // 2. Not Authenticated
  if (!isAuthenticated) {
    return null
  }

  // 3. Permission Check
  if (!hasAccess) {
    return <AccessDenied403 />
  }

  // 4. Authorized
  return <>{children}</>
}
