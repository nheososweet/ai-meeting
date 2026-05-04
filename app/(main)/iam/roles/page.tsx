"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDownIcon, ChevronRightIcon, EditIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { ConfirmDialog } from "@/components/iam/shared/confirm-dialog"
import { EmptyState } from "@/components/iam/shared/empty-state"
import { useAuth } from "@/lib/auth/auth-context"
import { IAM_PERMISSIONS } from "@/lib/auth/permissions"
import { mockRoles, mockPermissions, flattenPermissionIds } from "@/lib/mock/iam"
import type { IamRole, IamPermission } from "@/lib/types/iam"
import { cn } from "@/lib/utils"

// ══════════════════════════════════════════════════════════
// Permission Tree Node
// ══════════════════════════════════════════════════════════

function getChildIds(node: IamPermission): string[] {
  const ids: string[] = [node.id]
  if (node.children) {
    for (const child of node.children) {
      ids.push(...getChildIds(child))
    }
  }
  return ids
}

function getCheckState(
  node: IamPermission,
  selectedIds: Set<string>
): "checked" | "unchecked" | "indeterminate" {
  if (!node.children || node.children.length === 0) {
    return selectedIds.has(node.id) ? "checked" : "unchecked"
  }
  const childStates = node.children.map((c) => getCheckState(c, selectedIds))
  if (childStates.every((s) => s === "checked")) return "checked"
  if (childStates.every((s) => s === "unchecked")) return "unchecked"
  return "indeterminate"
}

function PermissionTreeNode({
  node,
  selectedIds,
  onToggle,
  level = 0,
  disabled = false,
}: {
  node: IamPermission
  selectedIds: Set<string>
  onToggle: (ids: string[], checked: boolean) => void
  level?: number
  disabled?: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = Boolean(node.children?.length)
  const state = getCheckState(node, selectedIds)

  function handleCheck() {
    const allIds = getChildIds(node)
    onToggle(allIds, state !== "checked")
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40",
          level > 0 && "ml-5"
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
          </button>
        ) : (
          <span className="size-5" />
        )}
        <Checkbox
          checked={state === "checked" ? true : state === "indeterminate" ? "indeterminate" : false}
          onCheckedChange={handleCheck}
          disabled={disabled}
          className="shrink-0"
        />
        <span className={cn("text-sm", level === 0 ? "font-semibold text-foreground" : "text-foreground/90")}>
          {node.label}
        </span>
        <span className="text-[11px] text-muted-foreground">({node.code})</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <PermissionTreeNode
              key={child.id}
              node={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
              level={level + 1}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// Role Form Dialog
// ══════════════════════════════════════════════════════════

function RoleFormDialog({
  open,
  onOpenChange,
  role,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  role?: IamRole | null
  onSave: (data: { name: string; description: string }) => void
}) {
  const [name, setName] = useState(role?.name ?? "")
  const [description, setDescription] = useState(role?.description ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isEdit = Boolean(role)

  function handleSubmit() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Tên vai trò không được để trống"
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSave({ name: name.trim(), description: description.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) { setName(role?.name ?? ""); setDescription(role?.description ?? ""); setErrors({}) }
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa vai trò" : "Tạo vai trò mới"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Cập nhật thông tin vai trò." : "Điền thông tin để tạo vai trò mới."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="role-name">Tên vai trò <span className="text-destructive">*</span></Label>
            <Input id="role-name" value={name} onChange={(e) => { setName(e.target.value); setErrors({}) }} placeholder="Admin" />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="role-desc">Mô tả</Label>
            <Input id="role-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả vai trò..." />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild><Button variant="outline">Hủy</Button></DialogClose>
          <Button onClick={handleSubmit}>{isEdit ? "Cập nhật" : "Tạo mới"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ══════════════════════════════════════════════════════════
// Roles Page
// ══════════════════════════════════════════════════════════

export default function RolesPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission(IAM_PERMISSIONS.ROLES_MANAGE)

  const [roles, setRoles] = useState<IamRole[]>(mockRoles)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(mockRoles[0]?.id ?? null)

  // Permission editing state
  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null
  const [editedPermIds, setEditedPermIds] = useState<Set<string>>(
    new Set(selectedRole?.permissionIds ?? [])
  )
  const [isDirty, setIsDirty] = useState(false)

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<IamRole | null>(null)
  const [deleteRole, setDeleteRole] = useState<IamRole | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Sync when selecting a different role
  function selectRole(id: string) {
    setSelectedRoleId(id)
    const role = roles.find((r) => r.id === id)
    setEditedPermIds(new Set(role?.permissionIds ?? []))
    setIsDirty(false)
  }

  function handleTogglePermissions(ids: string[], checked: boolean) {
    setEditedPermIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
    setIsDirty(true)
  }

  function handleSavePermissions() {
    if (!selectedRoleId) return
    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRoleId ? { ...r, permissionIds: Array.from(editedPermIds) } : r
      )
    )
    setIsDirty(false)
  }

  function handleCancelPermissions() {
    setEditedPermIds(new Set(selectedRole?.permissionIds ?? []))
    setIsDirty(false)
  }

  function handleCreateRole(data: { name: string; description: string }) {
    const newRole: IamRole = { id: `role-${Date.now()}`, name: data.name, description: data.description, permissionIds: [] }
    setRoles((prev) => [...prev, newRole])
    selectRole(newRole.id)
  }

  function handleEditRole(data: { name: string; description: string }) {
    if (!editingRole) return
    setRoles((prev) =>
      prev.map((r) => (r.id === editingRole.id ? { ...r, name: data.name, description: data.description } : r))
    )
    setEditingRole(null)
  }

  function handleDeleteRole() {
    if (!deleteRole) return
    setRoles((prev) => prev.filter((r) => r.id !== deleteRole.id))
    if (selectedRoleId === deleteRole.id) {
      setSelectedRoleId(roles.find((r) => r.id !== deleteRole.id)?.id ?? null)
    }
    setDeleteOpen(false)
    setDeleteRole(null)
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4 lg:flex-row">
      {/* Left: Role list */}
      <div className="flex w-full lg:w-[260px] shrink-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-bold text-foreground">Vai trò</h2>
          {canManage && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingRole(null); setFormOpen(true) }}>
              <PlusIcon className="mr-1 size-3.5" /> Tạo
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => selectRole(role.id)}
              className={cn(
                "flex w-full flex-col border-b border-border/40 px-4 py-3 text-left transition-colors",
                selectedRoleId === role.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/40"
              )}
            >
              <span className="text-sm font-semibold text-foreground">{role.name}</span>
              <span className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{role.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Permission tree */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
        {selectedRole ? (
          <>
            <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-3">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Phân quyền: {selectedRole.name}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{selectedRole.description}</p>
              </div>
              <div className="flex gap-1.5">
                {canManage && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      title="Chỉnh sửa thông tin"
                      onClick={() => { setEditingRole(selectedRole); setFormOpen(true) }}
                    >
                      <EditIcon className="mr-1 size-3.5" /> Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      title="Xóa vai trò"
                      onClick={() => { setDeleteRole(selectedRole); setDeleteOpen(true) }}
                    >
                      <Trash2Icon className="mr-1 size-3.5" /> Xóa
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {mockPermissions.map((perm) => (
                <PermissionTreeNode
                  key={perm.id}
                  node={perm}
                  selectedIds={editedPermIds}
                  onToggle={handleTogglePermissions}
                  disabled={!canManage}
                />
              ))}
            </div>
            {canManage && isDirty && (
              <div className="flex items-center justify-end gap-2 border-t border-border/60 px-5 py-3">
                <Button variant="outline" size="sm" onClick={handleCancelPermissions}>
                  Hủy thay đổi
                </Button>
                <Button size="sm" onClick={handleSavePermissions}>
                  <SaveIcon className="mr-1.5 size-4" /> Lưu thay đổi
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState emptyText="Chọn một vai trò để xem phân quyền." />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        role={editingRole}
        onSave={editingRole ? handleEditRole : handleCreateRole}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa vai trò"
        description={`Bạn có chắc chắn muốn xóa vai trò "${deleteRole?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleDeleteRole}
      />
    </div>
  )
}
