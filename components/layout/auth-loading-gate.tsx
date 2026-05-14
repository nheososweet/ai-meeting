"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { LoaderCircleIcon } from "lucide-react"

export function AuthLoadingGate({ children }: { children: React.ReactNode }) {
  const { isLoading, currentUser } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 1. Server side or first client pass → Always render loader if we don't have a user yet
  // Or even better, always render loader on server to match client's first pass if currentUser is from cache
  if (!mounted) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
        <LoaderCircleIcon className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">
          Đang xác thực phiên làm việc...
        </p>
      </div>
    )
  }

  // 2. After mount, we can safely branch based on client-side state
  // Có user (từ localStorage cache hoặc API) → render app ngay
  if (currentUser) return <>{children}</>

  // Đang loading (API call in progress) → full-page spinner
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
        <LoaderCircleIcon className="size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">
          Đang xác thực phiên làm việc...
        </p>
      </div>
    )
  }

  // Auth fail or No Token → Redirect to login
  if (!isLoading && !currentUser) {
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    return null
  }

  return <>{children}</>
}
