import { useState, useEffect, useMemo } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
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
import { Loader2Icon, ShieldAlertIcon } from "lucide-react"

export interface PermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  // Currently assigned permissions (since we might not be able to fetch them, we pass them if known)
  initialPermissions?: string[]
  isLoadingInitial?: boolean
  onSave: (permissions: string[]) => Promise<void>
  /** If provided, only show these permissions (= parent's owned permissions) */
  scopedPermissions?: string[]
}

export function PermissionsDialog({
  open,
  onOpenChange,
  title,
  description,
  initialPermissions = [],
  isLoadingInitial = false,
  onSave,
  scopedPermissions,
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
        // Map qua getPermId để đề phòng initialPermissions bị trả về là object thay vì string
        setSelectedPerms(initialPermissions.map(getPermId))
      } else {
        setSelectedPerms([])
      }
    }
  }, [open, initialPermissions])

  // Helper to extract string ID from mixed API response (string or object)
  function getPermId(perm: any): string {
    if (typeof perm === "string") return perm
    return perm?.slug || perm?.code || perm?.id || perm?.name || perm?.permission || JSON.stringify(perm)
  }

  // Helper to extract human readable label
  function getPermLabel(perm: any): string {
    if (typeof perm === "string") return perm
    return perm?.description || perm?.name || perm?.slug || perm?.code || perm?.id || perm?.permission || JSON.stringify(perm)
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
      // Error handling could be improved with toast
    } finally {
      setIsSaving(false)
    }
  }

  const permissionsList = useMemo(() => {
    const all = Array.isArray(allPerms) ? allPerms : []
    if (!scopedPermissions) return all
    return all.filter((p) => scopedPermissions.includes(getPermId(p)))
  }, [allPerms, scopedPermissions])

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
              {scopedPermissions ? (
                "Tổ chức/Nhóm cấp trên chưa được gán quyền nào. Vui lòng gán quyền cho cấp trên trước."
              ) : (
                "Chưa có dữ liệu quyền trên hệ thống."
              )}
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

              <div className="grid gap-3 pl-1">
                {permissionsList.map((rawPerm: any, index: number) => {
                  const permId = getPermId(rawPerm)
                  const permLabel = getPermLabel(rawPerm)
                  return (
                    <div key={`${permId}-${index}`} className="flex items-start gap-3">
                      <Checkbox
                        id={`perm-${index}`}
                        checked={selectedPerms.includes(permId)}
                        onCheckedChange={() => togglePermission(permId)}
                        className="mt-0.5"
                      />
                      <div className="grid gap-1">
                        <Label
                          htmlFor={`perm-${index}`}
                          className="cursor-pointer font-medium leading-none break-all"
                        >
                          {permLabel}
                        </Label>
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
