import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { iamService } from "@/services/iam.service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2Icon, ShieldAlertIcon, ShieldIcon, BriefcaseIcon, ZapIcon, HelpCircleIcon } from "lucide-react"
import { PERMISSION_LABELS, PERMISSION_GROUPS } from "@/lib/auth/permissions"

export interface PermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  // Currently assigned permissions
  initialPermissions?: string[]
  isLoadingInitial?: boolean
  onSave: (permissions: string[]) => Promise<void>
}

export function PermissionsDialog({
  open,
  onOpenChange,
  title,
  description,
  initialPermissions = [],
  isLoadingInitial = false,
  onSave,
}: PermissionsDialogProps) {
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Fetch all available permissions from backend
  const { data: allPerms, isLoading, error } = useQuery({
    queryKey: ["iam", "permissions"],
    queryFn: iamService.getPermissions,
    enabled: open,
  })

  // Ensure initialPermissions are set when dialog opens
  useEffect(() => {
    if (open) {
      if (Array.isArray(initialPermissions)) {
        setSelectedPerms(initialPermissions.map(getPermId))
      } else {
        setSelectedPerms([])
      }
    }
  }, [open, initialPermissions])

  // Helper to extract string ID from mixed API response
  function getPermId(perm: any): string {
    if (typeof perm === "string") return perm
    return perm?.slug || perm?.code || perm?.id || perm?.name || perm?.permission || JSON.stringify(perm)
  }

  // Helper to extract human readable label
  function getPermLabel(perm: any): string {
    const id = getPermId(perm)
    if (PERMISSION_LABELS[id]) return PERMISSION_LABELS[id]

    if (typeof perm !== "string" && perm?.description && !perm.description.startsWith("Permission for")) {
      return perm.description
    }

    return id
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  function togglePermission(permId: string) {
    setSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    )
  }

  function toggleAll() {
    if (!allPerms || !Array.isArray(allPerms)) return
    if (selectedPerms.length === allPerms.length) {
      setSelectedPerms([])
    } else {
      setSelectedPerms(allPerms.map(getPermId))
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await onSave(selectedPerms)
      onOpenChange(false)
    } catch (err) {
      console.error("Failed to save permissions", err)
    } finally {
      setIsSaving(false)
    }
  }

  const permissionsList = useMemo(() => {
    const list = Array.isArray(allPerms) ? allPerms : []
    const hiddenPerms = ["chat", "update_report", "transcribe"]
    return list.filter((p) => !hiddenPerms.includes(getPermId(p)))
  }, [allPerms])

  // Group permissions for display
  const groupedPermissions = useMemo(() => {
    if (permissionsList.length === 0) return []

    const groups = PERMISSION_GROUPS.map((g) => ({
      ...g,
      items: permissionsList.filter((p) => g.perms.includes(getPermId(p))),
    }))

    const groupedIds = new Set(PERMISSION_GROUPS.flatMap((g) => g.perms))
    const otherItems = permissionsList.filter((p) => !groupedIds.has(getPermId(p)))

    if (otherItems.length > 0) {
      groups.push({
        name: "Khác",
        icon: "HelpCircleIcon",
        perms: otherItems.map(getPermId),
        items: otherItems,
      })
    }

    return groups.filter((g) => g.items.length > 0)
  }, [permissionsList])

  const iconMap: Record<string, any> = {
    ShieldIcon,
    BriefcaseIcon,
    ZapIcon,
    HelpCircleIcon,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading || isLoadingInitial ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-32 flex-col items-center justify-center text-destructive text-center gap-2">
              <ShieldAlertIcon className="size-8 opacity-50" />
              <p className="text-sm">Không thể tải danh sách quyền.</p>
            </div>
          ) : permissionsList.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground text-sm text-center px-4">
              Chưa có dữ liệu quyền trên hệ thống.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 p-3">
                <Checkbox
                  id="select-all-perms"
                  checked={selectedPerms.length === permissionsList.length && permissionsList.length > 0}
                  onCheckedChange={toggleAll}
                />
                <Label
                  htmlFor="select-all-perms"
                  className="flex-1 cursor-pointer font-semibold"
                >
                  Chọn tất cả quyền ({selectedPerms.length}/{permissionsList.length})
                </Label>
              </div>

              <div className="space-y-6">
                {groupedPermissions.map((group) => {
                  const Icon = iconMap[group.icon] || HelpCircleIcon
                  return (
                    <div key={group.name} className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                        <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Icon className="size-3.5" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/70">
                          {group.name}
                        </h3>
                      </div>

                      <div className="grid gap-3.5 pl-1">
                        {group.items.map((rawPerm: any, index: number) => {
                          const permId = getPermId(rawPerm)
                          const permLabel = getPermLabel(rawPerm)
                          const uniqueId = `perm-${permId}-${index}`

                          return (
                            <div key={uniqueId} className="flex items-start gap-3 group/item">
                              <Checkbox
                                id={uniqueId}
                                checked={selectedPerms.includes(permId)}
                                onCheckedChange={() => togglePermission(permId)}
                                className="mt-0.5"
                              />
                              <div className="grid gap-1">
                                <Label
                                  htmlFor={uniqueId}
                                  className="cursor-pointer font-medium leading-none break-all group-hover/item:text-primary transition-colors"
                                >
                                  {permLabel}
                                </Label>
                                <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">
                                  {permId}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-4 border-t border-border/40">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Lưu phân quyền
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
