"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { PermissionGuard } from "@/components/iam/shared/permission-guard"

const iamTabs = [
  { label: "Tài khoản", href: "/iam/users", permCode: "manage_users" },
  { label: "Vai trò", href: "/iam/roles", permCode: "manage_role" },
  { label: "Công ty", href: "/iam/companies", permCode: "manage_companies" },
  { label: "Nhóm", href: "/iam/groups", permCode: "manage_groups" },
]

export default function IamLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { hasPermission, hasScope, isLoading } = useAuth()
  const isGlobal = hasScope("global")

  // Filter tabs by permission and scope
  const visibleTabs = iamTabs.filter((tab) => {
    // Company tab is only for global admins
    if (tab.href === "/iam/companies") {
      return isGlobal && hasPermission("manage_companies")
    }
    return hasPermission(tab.permCode)
  })

  // Tự động chuyển hướng nếu đang ở route gốc /iam và đã load xong auth
  useEffect(() => {
    if (pathname === "/iam" && !isLoading && visibleTabs.length > 0) {
      router.replace(visibleTabs[0].href)
    }
  }, [pathname, isLoading, visibleTabs, router])

  // Get current route's required permission
  const currentTab = iamTabs.find(tab => pathname.startsWith(tab.href))
  const requiredPerm = currentTab?.permCode

  return (
    <PermissionGuard
      permissions={["manage_users", "manage_groups", "manage_role", "manage_companies"]}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
        {/* IAM Header + Tab Navigation */}
        <div className="shrink-0 rounded-lg border border-border/80 bg-card shadow-sm">
          <div className="px-5 pt-4 pb-0">
            <h1 className="text-lg font-bold text-foreground">Quản trị Hệ thống</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Quản lý tài khoản, vai trò, phân quyền và nhóm người dùng
            </p>
          </div>

          {/* Tabs */}
          <div className="mt-3 flex gap-0 border-b border-border/60 px-5">
            {visibleTabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "relative px-4 py-2.5 text-[13px] font-semibold transition-colors",
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

        {/* Content with specific guard per tab */}
        <div className="flex-1 min-h-0 flex flex-col">
          <PermissionGuard
            permission={requiredPerm}
          >
            {children}
          </PermissionGuard>
        </div>
      </div>
    </PermissionGuard>
  )
}
