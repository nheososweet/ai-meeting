"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  EditIcon,
  FolderIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UserMinusIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react"
import { ConfirmDialog } from "@/components/iam/shared/confirm-dialog"
import { EmptyState } from "@/components/iam/shared/empty-state"
import { StatusBadge } from "@/components/iam/shared/status-badge"
import { useAuth } from "@/lib/auth/auth-context"
import { IAM_PERMISSIONS } from "@/lib/auth/permissions"
import { mockGroups, mockUsers, mockRoles } from "@/lib/mock/iam"
import type { IamGroup, IamUser, IamRole } from "@/lib/types/iam"
import { cn } from "@/lib/utils"

// ══════════════════════════════════════════════════════════
// Group Tree Node
// ══════════════════════════════════════════════════════════

function GroupTreeNode({
  group,
  selectedId,
  onSelect,
  level = 0,
}: {
  group: IamGroup
  selectedId: string | null
  onSelect: (id: string) => void
  level?: number
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = Boolean(group.children?.length)
  const isSelected = selectedId === group.id

  return (
    <div>
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
          isSelected ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted/40",
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={() => onSelect(group.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="flex size-5 shrink-0 items-center justify-center rounded"
          >
            {expanded ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
          </button>
        ) : (
          <span className="size-5" />
        )}
        <FolderIcon className="size-4 shrink-0 text-primary/70" />
        <span className="flex-1 truncate">{group.name}</span>
        <span className="text-[11px] text-muted-foreground">{group.memberIds.length}</span>
      </button>
      {hasChildren && expanded && (
        <div>
          {group.children!.map((child) => (
            <GroupTreeNode key={child.id} group={child} selectedId={selectedId} onSelect={onSelect} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// Group Form Dialog
// ══════════════════════════════════════════════════════════

function flattenGroups(groups: IamGroup[], exclude?: string): { id: string; name: string }[] {
  const result: { id: string; name: string }[] = []
  for (const g of groups) {
    if (g.id !== exclude) result.push({ id: g.id, name: g.name })
    if (g.children) result.push(...flattenGroups(g.children, exclude))
  }
  return result
}

function GroupFormDialog({
  open,
  onOpenChange,
  group,
  allGroups,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  group?: IamGroup | null
  allGroups: IamGroup[]
  onSave: (data: { name: string; description: string; parentId: string | null }) => void
}) {
  const isEdit = Boolean(group)
  const [name, setName] = useState(group?.name ?? "")
  const [description, setDescription] = useState(group?.description ?? "")
  const [parentId, setParentId] = useState(group?.parentId ?? "__none__")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const parentOptions = flattenGroups(allGroups, group?.id)

  function handleSubmit() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Tên nhóm không được để trống"
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSave({ name: name.trim(), description: description.trim(), parentId: parentId === "__none__" ? null : parentId })
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) { setName(group?.name ?? ""); setDescription(group?.description ?? ""); setParentId(group?.parentId ?? "__none__"); setErrors({}) }
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa nhóm" : "Tạo nhóm mới"}</DialogTitle>
          <DialogDescription>{isEdit ? "Cập nhật thông tin nhóm." : "Điền thông tin để tạo nhóm mới."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Tên nhóm <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setErrors({}) }} placeholder="Ban Thư ký" />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label>Mô tả</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả nhóm..." />
          </div>
          <div className="grid gap-1.5">
            <Label>Nhóm cha</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue placeholder="Chọn nhóm cha..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Không có (nhóm gốc) —</SelectItem>
                {parentOptions.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
// Add Member / Role Dialog
// ══════════════════════════════════════════════════════════

function AddItemDialog<T extends { id: string }>({
  open,
  onOpenChange,
  title,
  description,
  items,
  excludeIds,
  renderItem,
  filterFn,
  onAdd,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description: string
  items: T[]
  excludeIds: string[]
  renderItem: (item: T) => React.ReactNode
  filterFn: (item: T, query: string) => boolean
  onAdd: (ids: string[]) => void
}) {
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const available = items.filter((i) => !excludeIds.includes(i.id))
  const filtered = search ? available.filter((i) => filterFn(i, search.toLowerCase())) : available

  function toggle(id: string) {
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  function handleOpen(v: boolean) {
    if (v) { setSearch(""); setSelectedIds([]) }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="h-9 pl-8 text-sm" />
        </div>
        <div className="max-h-[240px] overflow-y-auto rounded-md border border-border">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy mục phù hợp.</p>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedIds.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-b-0",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border text-xs transition-colors",
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  )}>
                    {isSelected && "✓"}
                  </div>
                  {renderItem(item)}
                </button>
              )
            })
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild><Button variant="outline">Hủy</Button></DialogClose>
          <Button onClick={() => { onAdd(selectedIds); onOpenChange(false) }} disabled={selectedIds.length === 0}>
            Thêm ({selectedIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ══════════════════════════════════════════════════════════
// Groups Page
// ══════════════════════════════════════════════════════════

function findGroupById(groups: IamGroup[], id: string): IamGroup | null {
  for (const g of groups) {
    if (g.id === id) return g
    if (g.children) {
      const found = findGroupById(g.children, id)
      if (found) return found
    }
  }
  return null
}

function updateGroupInTree(groups: IamGroup[], id: string, updater: (g: IamGroup) => IamGroup): IamGroup[] {
  return groups.map((g) => {
    if (g.id === id) return updater(g)
    if (g.children) return { ...g, children: updateGroupInTree(g.children, id, updater) }
    return g
  })
}

function removeGroupFromTree(groups: IamGroup[], id: string): IamGroup[] {
  return groups
    .filter((g) => g.id !== id)
    .map((g) => (g.children ? { ...g, children: removeGroupFromTree(g.children, id) } : g))
}

function addGroupToTree(groups: IamGroup[], newGroup: IamGroup, parentId: string | null): IamGroup[] {
  if (!parentId) return [...groups, newGroup]
  return groups.map((g) => {
    if (g.id === parentId) return { ...g, children: [...(g.children ?? []), newGroup] }
    if (g.children) return { ...g, children: addGroupToTree(g.children, newGroup, parentId) }
    return g
  })
}

export default function GroupsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission(IAM_PERMISSIONS.GROUPS_MANAGE)

  const [groups, setGroups] = useState<IamGroup[]>(mockGroups)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(mockGroups[0]?.id ?? null)

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<IamGroup | null>(null)
  const [deleteGroup, setDeleteGroup] = useState<IamGroup | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [clearMembersOpen, setClearMembersOpen] = useState(false)

  const selectedGroup = selectedGroupId ? findGroupById(groups, selectedGroupId) : null
  const groupMembers = mockUsers.filter((u) => selectedGroup?.memberIds.includes(u.id))
  const groupRoles = mockRoles.filter((r) => selectedGroup?.roleIds.includes(r.id))

  function handleCreateGroup(data: { name: string; description: string; parentId: string | null }) {
    const newGroup: IamGroup = {
      id: `grp-${Date.now()}`,
      name: data.name,
      description: data.description,
      parentId: data.parentId,
      memberIds: [],
      roleIds: [],
      children: [],
    }
    setGroups((prev) => addGroupToTree(prev, newGroup, data.parentId))
    setSelectedGroupId(newGroup.id)
  }

  function handleEditGroup(data: { name: string; description: string; parentId: string | null }) {
    if (!editingGroup) return
    setGroups((prev) =>
      updateGroupInTree(prev, editingGroup.id, (g) => ({ ...g, name: data.name, description: data.description }))
    )
    setEditingGroup(null)
  }

  function handleDeleteGroup() {
    if (!deleteGroup) return
    setGroups((prev) => removeGroupFromTree(prev, deleteGroup.id))
    if (selectedGroupId === deleteGroup.id) setSelectedGroupId(null)
    setDeleteOpen(false)
    setDeleteRole(null)
  }

  function setDeleteRole(_: null) { setDeleteGroup(null) }

  function handleAddMembers(userIds: string[]) {
    if (!selectedGroupId) return
    setGroups((prev) =>
      updateGroupInTree(prev, selectedGroupId, (g) => ({
        ...g,
        memberIds: [...new Set([...g.memberIds, ...userIds])],
      }))
    )
  }

  function handleRemoveMember(userId: string) {
    if (!selectedGroupId) return
    setGroups((prev) =>
      updateGroupInTree(prev, selectedGroupId, (g) => ({
        ...g,
        memberIds: g.memberIds.filter((id) => id !== userId),
      }))
    )
  }

  function handleClearMembers() {
    if (!selectedGroupId) return
    setGroups((prev) =>
      updateGroupInTree(prev, selectedGroupId, (g) => ({ ...g, memberIds: [] }))
    )
    setClearMembersOpen(false)
  }

  function handleAddRoles(roleIds: string[]) {
    if (!selectedGroupId) return
    setGroups((prev) =>
      updateGroupInTree(prev, selectedGroupId, (g) => ({
        ...g,
        roleIds: [...new Set([...g.roleIds, ...roleIds])],
      }))
    )
  }

  function handleRemoveRole(roleId: string) {
    if (!selectedGroupId) return
    setGroups((prev) =>
      updateGroupInTree(prev, selectedGroupId, (g) => ({
        ...g,
        roleIds: g.roleIds.filter((id) => id !== roleId),
      }))
    )
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4 lg:flex-row">
      {/* Left: Group tree */}
      <div className="flex w-full lg:w-[260px] shrink-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-bold text-foreground">Nhóm</h2>
          {canManage && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingGroup(null); setFormOpen(true) }}>
              <PlusIcon className="mr-1 size-3.5" /> Tạo
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          {groups.map((group) => (
            <GroupTreeNode key={group.id} group={group} selectedId={selectedGroupId} onSelect={setSelectedGroupId} />
          ))}
        </div>
      </div>

      {/* Right: Group detail */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
        {selectedGroup ? (
          <>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-3">
              <div>
                <h2 className="text-sm font-bold text-foreground">{selectedGroup.name}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{selectedGroup.description}</p>
              </div>
              {canManage && (
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditingGroup(selectedGroup); setFormOpen(true) }}>
                    <EditIcon className="mr-1 size-3.5" /> Sửa
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => { setDeleteGroup(selectedGroup); setDeleteOpen(true) }}>
                    <Trash2Icon className="mr-1 size-3.5" /> Xóa
                  </Button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="members" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="mx-5 mt-3 w-fit shrink-0">
                <TabsTrigger value="members">Thành viên ({selectedGroup.memberIds.length})</TabsTrigger>
                <TabsTrigger value="roles">Vai trò ({selectedGroup.roleIds.length})</TabsTrigger>
              </TabsList>

              {/* Members Tab */}
              <TabsContent value="members" className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Danh sách thành viên trong nhóm</p>
                  {canManage && (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddUserOpen(true)}>
                        <UserPlusIcon className="mr-1 size-3.5" /> Thêm
                      </Button>
                      {groupMembers.length > 0 && (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setClearMembersOpen(true)}>
                          <Trash2Icon className="mr-1 size-3.5" /> Xóa tất cả
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {groupMembers.length === 0 ? (
                  <EmptyState emptyText="Nhóm chưa có thành viên." />
                ) : (
                  <div className="rounded-md border border-border">
                    {groupMembers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between border-b border-border/60 px-3 py-2.5 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={user.status} />
                          {canManage && (
                            <Button size="icon" variant="ghost" className="size-7" onClick={() => handleRemoveMember(user.id)}>
                              <XIcon className="size-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Roles Tab */}
              <TabsContent value="roles" className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Vai trò được gán cho nhóm</p>
                  {canManage && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddRoleOpen(true)}>
                      <PlusIcon className="mr-1 size-3.5" /> Gán vai trò
                    </Button>
                  )}
                </div>
                {groupRoles.length === 0 ? (
                  <EmptyState emptyText="Nhóm chưa được gán vai trò." />
                ) : (
                  <div className="rounded-md border border-border">
                    {groupRoles.map((role) => (
                      <div key={role.id} className="flex items-center justify-between border-b border-border/60 px-3 py-2.5 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{role.name}</p>
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        </div>
                        {canManage && (
                          <Button size="icon" variant="ghost" className="size-7" onClick={() => handleRemoveRole(role.id)}>
                            <XIcon className="size-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState emptyText="Chọn một nhóm để xem chi tiết." />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <GroupFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        group={editingGroup}
        allGroups={groups}
        onSave={editingGroup ? handleEditGroup : handleCreateGroup}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa nhóm"
        description={`Bạn có chắc chắn muốn xóa nhóm "${deleteGroup?.name}"? Tất cả thành viên sẽ bị gỡ khỏi nhóm này.`}
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleDeleteGroup}
      />
      <ConfirmDialog
        open={clearMembersOpen}
        onOpenChange={setClearMembersOpen}
        title="Xóa toàn bộ thành viên"
        description={`Bạn có chắc chắn muốn xóa toàn bộ ${selectedGroup?.memberIds.length ?? 0} thành viên khỏi nhóm "${selectedGroup?.name}"?`}
        confirmLabel="Xóa tất cả"
        variant="destructive"
        onConfirm={handleClearMembers}
      />
      <AddItemDialog<IamUser>
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        title="Thêm thành viên"
        description="Chọn người dùng để thêm vào nhóm."
        items={mockUsers}
        excludeIds={selectedGroup?.memberIds ?? []}
        renderItem={(user) => (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}
        filterFn={(user, q) => user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)}
        onAdd={handleAddMembers}
      />
      <AddItemDialog<IamRole>
        open={addRoleOpen}
        onOpenChange={setAddRoleOpen}
        title="Gán vai trò cho nhóm"
        description="Chọn vai trò để gán cho nhóm."
        items={mockRoles}
        excludeIds={selectedGroup?.roleIds ?? []}
        renderItem={(role) => (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{role.name}</p>
            <p className="truncate text-xs text-muted-foreground">{role.description}</p>
          </div>
        )}
        filterFn={(role, q) => role.name.toLowerCase().includes(q) || role.description.toLowerCase().includes(q)}
        onAdd={handleAddRoles}
      />
    </div>
  )
}
