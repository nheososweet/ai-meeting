"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { LoaderCircleIcon } from "lucide-react"

export function AuthLoadingGate({ children }: { children: React.ReactNode }) {
  const { isLoading, currentUser } = useAuth()

  // Có user (từ localStorage cache hoặc API) → render app ngay
  if (currentUser) return <>{children}</>

  // Đang loading lần đầu (không cache) → full-page spinner
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

  // Auth fail → proxy.ts sẽ redirect, render children tạm
  return <>{children}</>
}
