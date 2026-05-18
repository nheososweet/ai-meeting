"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  ShieldIcon,
  BriefcaseIcon,
  ZapIcon,
  HelpCircleIcon,
  CheckCircle2Icon,
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { PERMISSION_LABELS, PERMISSION_GROUPS } from "@/lib/auth/permissions"
import { cn } from "@/lib/utils"

interface UserPermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "admin": return "Quản trị viên"
    case "member": return "Thành viên"
    default: return role
  }
}

function getScopeLabel(scope: string | null): string {
  switch (scope) {
    case "global": return "Toàn cục"
    case "company": return "Tổ chức"
    case "group": return "Nhóm"
    default: return "—"
  }
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldIcon,
  BriefcaseIcon,
  ZapIcon,
  HelpCircleIcon,
}

export function UserPermissionsDialog({
  open,
  onOpenChange,
}: UserPermissionsDialogProps) {
  const { currentUser } = useAuth()

  if (!currentUser) return null

  const userPerms = new Set(currentUser.permissions ?? [])

  // Only show permissions the user actually has (security: don't reveal other permissions)
  const groupedPermissions = PERMISSION_GROUPS.map((group) => ({
    ...group,
    items: group.perms
      .filter((code) => userPerms.has(code))
      .map((code) => ({
        code,
        label: PERMISSION_LABELS[code] ?? code
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      })),
  })).filter((g) => g.items.length > 0)

  const permCount = currentUser.permissions?.length ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldIcon className="size-4" />
            </div>
            Quyền hạn của bạn
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
                  currentUser.role === "admin"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <ShieldIcon className="size-3" />
                {getRoleLabel(currentUser.role)}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                Phạm vi: <strong>{getScopeLabel(currentUser.scope)}</strong>
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {permCount} quyền
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {groupedPermissions.map((group) => {
            const Icon = iconMap[group.icon] || HelpCircleIcon

            return (
              <div key={group.name} className="space-y-3">
                {/* Group header */}
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-3.5" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/70 flex-1">
                    {group.name}
                  </h3>
                  <span className="text-[12px] font-medium text-muted-foreground tabular-nums">
                    {group.items.length}
                  </span>
                </div>

                {/* Permission items */}
                <div className="grid gap-2.5 pl-1">
                  {group.items.map((item) => (
                    <div
                      key={item.code}
                      className="flex items-start gap-2.5 rounded-md px-2 py-1.5 bg-emerald-500/5"
                    >
                      <CheckCircle2Icon className="size-4 mt-0.5 text-emerald-500 shrink-0" />
                      <div className="grid gap-0.5 min-w-0">
                        <span className="text-sm font-medium leading-tight text-foreground">
                          {item.label}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground/50 uppercase">
                          {item.code}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t border-border/40">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
