"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { WBS_ROUTE_PERMISSIONS } from "@/lib/auth/permissions"
import { FolderKanbanIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

const wbsTabs = [
  { label: "Dự án & Chiến dịch", href: "/wbs/projects", permCode: "wbs.projects.view" },
  { label: "Giao việc & Điều phối", href: "/wbs/assignments", permCode: "wbs.assignments.view" },
  { label: "Lưu trữ Đám mây", href: "/wbs/files", permCode: "wbs.files.view" },
]

export default function WbsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { hasPermission, hasAnyPermission } = useAuth()

  // Route Guard: check if user can access any WBS route
  const requiredPerm = Object.entries(WBS_ROUTE_PERMISSIONS).find(([route]) =>
    pathname.startsWith(route),
  )?.[1]

  const canAccessRoute = requiredPerm ? hasPermission(requiredPerm) : hasAnyPermission(Object.values(WBS_ROUTE_PERMISSIONS))

  if (!canAccessRoute) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-border/80 bg-card p-12 text-center shadow-sm">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <FolderKanbanIcon className="size-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Không có quyền truy cập</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Bạn không có quyền truy cập trang Quản lý Bảng dịch. Vui lòng liên hệ quản trị viên để được cấp quyền phù hợp.
        </p>
        <Button variant="outline" asChild>
          <Link href="/meeting">← Quay lại trang chủ</Link>
        </Button>
      </div>
    )
  }

  // Filter tabs by permission
  const visibleTabs = wbsTabs.filter((tab) => hasPermission(tab.permCode))

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      {/* WBS Header + Tab Navigation */}
      <div className="shrink-0 rounded-lg border border-border/80 bg-card shadow-sm">
        <div className="px-5 pt-4 pb-0">
          <h1 className="text-lg font-bold text-foreground">Quản lý Bảng dịch</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Quản lý dự án, chiến dịch truyền thông, giao việc và lưu trữ tệp tin
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex gap-0 border-b border-border/60 px-5 overflow-x-auto no-scrollbar">
          {visibleTabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative whitespace-nowrap px-4 py-2.5 text-[13px] font-semibold transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  )
}
