"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusIcon, Loader2Icon, Building2Icon } from "lucide-react"

import { useAuth } from "@/lib/auth/auth-context"
import { EmptyState } from "@/components/iam/shared/empty-state"
import { PermissionsDialog } from "@/components/iam/shared/permissions-dialog"

import { useCompanies, useInfiniteCompanies } from "@/hooks/iam/use-companies"
import { useGroups, useAssignGroupPermissions, useGroupPermissions } from "@/hooks/iam/use-groups"
import { CreateGroupDialog, EditGroupDialog } from "./_components/group-dialogs"
import { IAMCombobox } from "@/components/iam/shared/iam-combobox"
import type { Group } from "@/lib/types/iam"
import { GroupTreeView } from "@/components/iam/groups/group-tree-view"

export default function GroupsPage() {
  const { hasPermission, currentUser } = useAuth()
  // Kiểm tra quyền
  const canManage = hasPermission("manage_groups")
  const isAdmin = currentUser?.role === "admin"

  // State: Chọn công ty
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")

  // State: Dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [permDialogOpen, setPermDialogOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [parentGroupId, setParentGroupId] = useState<string>("__none__")

  // Data fetching
  const { data: companiesData } = useCompanies()
  const companies = companiesData?.data || []

  // Tự động chọn công ty phù hợp
  if (!selectedCompanyId) {
    if (!isAdmin && currentUser?.companyId) {
      setSelectedCompanyId(String(currentUser.companyId))
    } else if (companies.length > 0) {
      setSelectedCompanyId(String(companies[0].id))
    }
  }

  const parsedCompanyId = isAdmin
    ? (selectedCompanyId ? Number(selectedCompanyId) : null)
    : (currentUser?.companyId || null)

  const { data: groupsData, isLoading: isLoadingGroups, error: groupsError } = useGroups(parsedCompanyId)
  const groups = groupsData?.data || []

  const { data: groupPerms, isLoading: isLoadingGroupPerms } = useGroupPermissions(
    permDialogOpen && selectedGroup ? selectedGroup.id : undefined
  )

  // Mutations
  const assignPermsMutation = useAssignGroupPermissions()

  async function handleSavePermissions(permissions: string[]) {
    if (!selectedGroup) return
    await assignPermsMutation.mutateAsync({ groupId: selectedGroup.id, perms: permissions })
  }

  // Tìm tên công ty đang được chọn để hiển thị text cho thân thiện
  const selectedCompanyName = companies.find((c) => String(c.id) === selectedCompanyId)?.name || ""

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground">Danh sách Nhóm</h2>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">Quản lý các nhóm trực thuộc công ty.</p>
        </div>

        {canManage && parsedCompanyId && (
          <Button onClick={() => { setParentGroupId("__none__"); setCreateOpen(true) }} size="sm" className="shrink-0">
            <PlusIcon className="mr-1.5 size-4" /> Thêm Nhóm
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-border/40 bg-muted/5 p-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Cơ cấu tổ chức:</span>
          {isAdmin ? (
            <IAMCombobox
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
              placeholder="Chọn tổ chức..."
              searchPlaceholder="Tìm tên tổ chức..."
              className="h-9 w-full sm:w-[240px]"
              useInfiniteHook={useInfiniteCompanies}
              selectedLabel={selectedCompanyName}
            />
          ) : currentUser?.company && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Building2Icon className="size-4" />
              <span>{currentUser.company.name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {!parsedCompanyId ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            Vui lòng chọn một Tổ chức để xem danh sách Nhóm.
          </div>
        ) : isLoadingGroups ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : groupsError ? (
          <div className="flex h-40 flex-col items-center justify-center text-destructive">
            Đã có lỗi xảy ra khi tải dữ liệu nhóm.
          </div>
        ) : groups.length === 0 ? (
          <EmptyState emptyText={`Tổ chức "${selectedCompanyName}" chưa có nhóm nào.`} />
        ) : (
          <GroupTreeView
            groups={groups}
            isLoading={isLoadingGroups}
            canManage={canManage}
            onAssignPerms={(group) => {
              setSelectedGroup(group)
              setPermDialogOpen(true)
            }}
            onAddChild={(parent) => {
              setParentGroupId(String(parent.id))
              setCreateOpen(true)
            }}
            onEdit={(group) => {
              setSelectedGroup(group)
              setEditOpen(true)
            }}
          />
        )}
      </div>

      {/* Dialog Tạo Nhóm Mới */}
      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyId={parsedCompanyId}
        companyName={selectedCompanyName}
        groups={groups}
        initialParentId={parentGroupId}
      />

      {/* Dialog Sửa Tên Nhóm */}
      <EditGroupDialog open={editOpen} onOpenChange={setEditOpen} group={selectedGroup} />

      {/* Dialog Phân Quyền */}
      <PermissionsDialog
        open={permDialogOpen}
        onOpenChange={setPermDialogOpen}
        title={`Phân quyền Group: ${selectedGroup?.name}`}
        description={`Cấp quyền cho nhóm này. Thành viên cấp Group sẽ thừa hưởng các quyền này.`}
        initialPermissions={groupPerms || []}
        isLoadingInitial={isLoadingGroupPerms}
        onSave={handleSavePermissions}
      />
    </div>
  )
}
