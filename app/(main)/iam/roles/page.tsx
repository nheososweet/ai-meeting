"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  PlusIcon, 
  ShieldIcon, 
  Trash2Icon, 
  Loader2Icon, 
  SearchIcon, 
  PencilIcon,
  FilterXIcon,
  LockIcon
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn, formatDate } from "@/lib/utils"

import { useAuth } from "@/lib/auth/auth-context"
import { EmptyState } from "@/components/iam/shared/empty-state"
import { ConfirmDialog } from "@/components/iam/shared/confirm-dialog"
import { PermissionsDialog } from "@/components/iam/shared/permissions-dialog"

import { useRoles, useDeleteRole, useRolePermissions, useAssignRolePermissions } from "@/hooks/iam/use-roles"
import { CreateRoleDialog } from "./_components/create-role-dialog"
import { EditRoleDialog } from "./_components/edit-role-dialog"

import type { Role } from "@/services/iam.service"

export default function RolesPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission("manage_role")

  // --- State for Dialogs ---
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [permDialogOpen, setPermDialogOpen] = useState(false)
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  // --- Search & Filter State ---
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 500)

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // --- Data Fetching ---
  const { data: rolesData, isLoading: isLoadingRoles } = useRoles({
    page,
    page_size: 10,
    search: debouncedSearch || undefined,
  })
  
  const roles = rolesData?.data || []
  const meta = rolesData?.meta

  const { data: rolePermsData, isLoading: isLoadingRolePerms } = useRolePermissions(
    permDialogOpen && selectedRole ? selectedRole.id : undefined
  )
  const rolePerms = rolePermsData?.permissions || []

  // --- Mutations ---
  const deleteMutation = useDeleteRole()
  const assignPermsMutation = useAssignRolePermissions()

  function handleDelete() {
    if (!selectedRole) return
    deleteMutation.mutate(selectedRole.id, {
      onSuccess: () => setDeleteOpen(false),
    })
  }

  async function handleSavePermissions(permissions: string[]) {
    if (!selectedRole) return
    await assignPermsMutation.mutateAsync({ roleId: selectedRole.id, perms: permissions })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground">Danh sách Vai trò</h2>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">Quản lý các nhóm quyền hạn được định nghĩa sẵn trong hệ thống.</p>
        </div>
        
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} size="sm" className="shrink-0">
            <PlusIcon className="mr-1.5 size-4" /> Thêm Vai trò
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-border/40 bg-muted/5 p-4">
        <div className="relative w-full sm:w-[280px]">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên vai trò..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 pr-8"
          />
          {search && (
            <button 
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>

        {search && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSearch("")}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            <FilterXIcon className="mr-1.5 size-3.5" /> Xóa bộ lọc
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingRoles ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : roles.length === 0 ? (
          <EmptyState emptyText={search ? "Không tìm thấy vai trò nào khớp với tìm kiếm." : "Chưa có vai trò nào được định nghĩa."} />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Tên Vai trò</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => {
                    const isSystemRole = role.name === "admin" || role.name === "member"
                    
                    return (
                      <TableRow key={role.id} className="group/row">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{role.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-semibold text-sm",
                              isSystemRole ? "text-primary" : "text-foreground/90"
                            )}>
                              {role.name}
                            </span>
                            {isSystemRole && (
                              <span title="Vai trò hệ thống">
                                <LockIcon className="size-3 text-muted-foreground/60" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground line-clamp-1" title={role.description}>
                            {role.description}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                          {formatDate(role.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                            {hasPermission("assign_permissions") && role.name !== "admin" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs hover:bg-primary/10 hover:text-primary"
                                onClick={() => {
                                  setSelectedRole(role)
                                  setPermDialogOpen(true)
                                }}
                              >
                                <ShieldIcon className="mr-1.5 size-3.5" /> Phân quyền
                              </Button>
                            )}
                            
                            {canManage && (
                              <>
                                {role.name !== "admin" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    onClick={() => {
                                      setSelectedRole(role)
                                      setEditOpen(true)
                                    }}
                                  >
                                    <PencilIcon className="size-3.5" />
                                  </Button>
                                )}

                                {!isSystemRole && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      setSelectedRole(role)
                                      setDeleteOpen(true)
                                    }}
                                  >
                                    <Trash2Icon className="size-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {meta && meta.total_pages > 1 && (
              <div className="flex items-center justify-between py-2">
                <div className="text-xs text-muted-foreground">
                  Hiển thị <span className="font-medium text-foreground">{(meta.page - 1) * meta.page_size + 1}</span> - <span className="font-medium text-foreground">{Math.min(meta.page * meta.page_size, meta.total_items)}</span> trong <span className="font-medium text-foreground">{meta.total_items}</span> vai trò
                </div>
                
                <Pagination className="w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={(e) => {
                          e.preventDefault()
                          if (meta.has_prev) setPage(p => p - 1)
                        }}
                        className={cn("cursor-pointer", !meta.has_prev && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map((p) => {
                      if (p === 1 || p === meta.total_pages || (p >= meta.page - 1 && p <= meta.page + 1)) {
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink 
                              isActive={p === meta.page}
                              onClick={(e) => {
                                e.preventDefault()
                                setPage(p)
                              }}
                              className="cursor-pointer"
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      }
                      if (p === meta.page - 2 || p === meta.page + 2) {
                        return <PaginationItem key={p}><PaginationEllipsis /></PaginationItem>
                      }
                      return null
                    })}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={(e) => {
                          e.preventDefault()
                          if (meta.has_next) setPage(p => p + 1)
                        }}
                        className={cn("cursor-pointer", !meta.has_next && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE DIALOG */}
      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* EDIT DIALOG */}
      <EditRoleDialog open={editOpen} onOpenChange={setEditOpen} role={selectedRole} />

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa Vai trò"
        description={`Bạn có chắc chắn muốn xóa vai trò "${selectedRole?.name}" vĩnh viễn khỏi hệ thống không? Các tài khoản đang gán vai trò này có thể bị ảnh hưởng.`}
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {/* PERMISSIONS DIALOG */}
      <PermissionsDialog
        open={permDialogOpen}
        onOpenChange={setPermDialogOpen}
        title={`Phân quyền Vai trò: ${selectedRole?.name}`}
        description="Gán các quyền hạn hệ thống cho vai trò này."
        initialPermissions={rolePerms}
        isLoadingInitial={isLoadingRolePerms}
        onSave={handleSavePermissions}
      />
    </div>
  )
}
