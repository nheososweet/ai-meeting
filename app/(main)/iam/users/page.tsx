"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  UserPlusIcon, 
  Trash2Icon, 
  Loader2Icon, 
  SearchIcon, 
  BuildingIcon, 
  UsersIcon, 
  GlobeIcon, 
  MailIcon, 
  FilterXIcon,
  PencilIcon,
  ShieldIcon,
  Building2Icon,
  PowerIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  UserCheckIcon,
  UserXIcon
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
import { Badge } from "@/components/ui/badge"
import { cn, formatDate } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useAuth } from "@/lib/auth/auth-context"
import { EmptyState } from "@/components/iam/shared/empty-state"
import { ConfirmDialog } from "@/components/iam/shared/confirm-dialog"
import { PermissionsDialog } from "@/components/iam/shared/permissions-dialog"

import { useUsers, useDeleteUser, useUpdateUser, useAssignUserPermissions, useUserPermissions } from "@/hooks/iam/use-users"
import { useInfiniteCompanies } from "@/hooks/iam/use-companies"
import { useInfiniteGroups } from "@/hooks/iam/use-groups"
import { CreateUserDialog } from "./_components/create-user-dialog"
import { EditUserDialog } from "./_components/edit-user-dialog"
import { IAMCombobox } from "@/components/iam/shared/iam-combobox"

import type { AuthMeResponse } from "@/lib/types/iam"

export default function UsersPage() {
  const { hasPermission, currentUser } = useAuth()
  const canManage = hasPermission("manage_users")
  const isAdmin = currentUser?.role === "admin"

  // --- State for Dialogs ---
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [permDialogOpen, setPermDialogOpen] = useState(false)
  
  const [selectedUser, setSelectedUser] = useState<AuthMeResponse | null>(null)

  // --- Search & Filter State ---
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [filterCompanyId, setFilterCompanyId] = useState<string>("")
  const [filterGroupId, setFilterGroupId] = useState<string>("")
  const debouncedSearch = useDebounce(search, 500)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filterCompanyId, filterGroupId])

  // Tự động set filter công ty cho người không phải admin
  useEffect(() => {
    if (!isAdmin && currentUser?.companyId) {
      setFilterCompanyId(String(currentUser.companyId))
    }
  }, [isAdmin, currentUser])

  // --- Data Fetching ---
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({
    page,
    search: debouncedSearch || undefined,
    search_companyid: isAdmin 
      ? (filterCompanyId !== "" ? Number(filterCompanyId) : undefined)
      : currentUser?.companyId || undefined,
    search_groupid: filterGroupId !== "" ? Number(filterGroupId) : undefined,
  })
  const parsedFilterCompanyId = filterCompanyId !== "" ? Number(filterCompanyId) : null
  
  const users = usersData?.data || []
  const meta = usersData?.meta

  const { data: userPerms, isLoading: isLoadingUserPerms } = useUserPermissions(
    permDialogOpen && selectedUser ? selectedUser.id : undefined
  )

  // --- Mutations ---
  const deleteMutation = useDeleteUser()
  const updateMutation = useUpdateUser()
  const assignPermsMutation = useAssignUserPermissions()

  function handleDelete() {
    if (!selectedUser) return
    deleteMutation.mutate(selectedUser.id, {
      onSuccess: () => setDeleteOpen(false),
    })
  }

  async function handleSavePermissions(permissions: string[]) {
    if (!selectedUser) return
    await assignPermsMutation.mutateAsync({ userId: selectedUser.id, perms: permissions })
  }

  function handleToggleStatus(user: AuthMeResponse) {
    updateMutation.mutate({ 
      userId: user.id, 
      payload: { is_active: !user.is_active } 
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground">Danh sách Tài khoản</h2>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">Quản lý người dùng, phân quyền và cấp độ truy cập.</p>
        </div>
        
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} size="sm" className="shrink-0">
            <UserPlusIcon className="mr-1.5 size-4" /> Thêm Tài khoản
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-border/40 bg-muted/5 p-4">
        <div className="relative w-full sm:w-[280px]">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc email..."
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

        {isAdmin ? (
          <IAMCombobox
            value={filterCompanyId}
            onValueChange={(v) => { setFilterCompanyId(v); setFilterGroupId("") }}
            placeholder="Tất cả tổ chức"
            searchPlaceholder="Tìm tổ chức..."
            className="h-9 w-full sm:w-[240px]"
            useInfiniteHook={useInfiniteCompanies}
          />
        ) : currentUser?.company && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Building2Icon className="size-4" />
            <span>{currentUser.company.name}</span>
          </div>
        )}

        <IAMCombobox
          value={filterGroupId}
          onValueChange={setFilterGroupId}
          placeholder="Tất cả nhóm"
          searchPlaceholder="Tìm nhóm..."
          disabled={!filterCompanyId}
          className="h-9 w-full sm:w-[240px]"
          useInfiniteHook={(params: any) => useInfiniteGroups(parsedFilterCompanyId, params)}
        />

        {(search || filterCompanyId !== "" || filterGroupId !== "") && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSearch("")
              if (isAdmin) {
                setFilterCompanyId("")
              } else if (currentUser?.companyId) {
                setFilterCompanyId(String(currentUser.companyId))
              }
              setFilterGroupId("")
            }}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            <FilterXIcon className="mr-1.5 size-3.5" /> Xóa bộ lọc
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingUsers ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState emptyText={search || filterCompanyId !== "all" ? "Không tìm thấy kết quả nào khớp với bộ lọc." : "Chưa có tài khoản nào trong hệ thống."} />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Tài khoản</TableHead>
                    <TableHead>Vai trò & Phạm vi</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="hidden lg:table-cell">Tổ chức / Nhóm</TableHead>
                    <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="group/row">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{user.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-foreground/90">{user.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MailIcon className="size-3" /> {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant={(typeof user.role === 'object' ? user.role.name : user.role) === "admin" ? "default" : "secondary"} className="h-5 text-[10px] uppercase tracking-wider px-1.5">
                            {typeof user.role === 'object' ? user.role.name : user.role}
                          </Badge>
                          {(typeof user.role === 'object' ? user.role.name : user.role) !== "member" && (
                            <Badge variant="outline" className={cn(
                              "h-5 text-[10px] uppercase tracking-wider px-1.5",
                              user.scope === "global" ? "border-amber-500/50 text-amber-600 bg-amber-500/5" :
                              user.scope === "company" ? "border-blue-500/50 text-blue-600 bg-blue-500/5" :
                              "border-green-500/50 text-green-600 bg-green-500/5"
                            )}>
                              {user.scope === "global" && <GlobeIcon className="mr-1 size-2.5" />}
                              {user.scope}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                         <Badge variant={user.is_active ? "outline" : "destructive"} className={cn(
                           "h-5 text-[10px] uppercase tracking-wider px-1.5",
                           user.is_active ? "border-emerald-500/50 text-emerald-600 bg-emerald-500/5" : "border-red-500/50 text-red-600 bg-red-500/5"
                         )}>
                           <span className={cn("mr-1.5 size-1.5 rounded-full", user.is_active ? "bg-emerald-500" : "bg-red-500")} />
                           {user.is_active ? "Hoạt động" : "Bị khóa"}
                         </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          {user.company ? (
                            <div className="flex items-center gap-1.5 text-xs text-foreground/80 font-medium truncate">
                              <BuildingIcon className="size-3 shrink-0 text-primary/60" />
                              <span className="truncate">{user.company.name}</span>
                            </div>
                          ) : user.scope === "global" ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 italic">
                              <GlobeIcon className="size-3 shrink-0" />
                              <span>Hệ thống</span>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground/40 italic">N/A</div>
                          )}
                          
                          {user.group && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate ml-4">
                              <UsersIcon className="size-3 shrink-0 opacity-70" />
                              <span className="truncate">{user.group.name}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          {hasPermission("assign_permissions") && user.scope !== "global" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs hover:bg-primary/10 hover:text-primary"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setPermDialogOpen(true)
                                  }}
                                >
                                  <ShieldIcon className="mr-1.5 size-3.5" /> Phân quyền
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Gán quyền trực tiếp cho tài khoản</TooltipContent>
                            </Tooltip>
                          )}
                          
                          {canManage && user.scope !== "global" && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "size-8",
                                      user.is_active ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                                    )}
                                    onClick={() => handleToggleStatus(user)}
                                    disabled={updateMutation.isPending}
                                  >
                                    {user.is_active ? <UserXIcon className="size-3.5" /> : <UserCheckIcon className="size-3.5" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{user.is_active ? "Vô hiệu hóa tài khoản" : "Kích hoạt tài khoản"}</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setEditOpen(true)
                                    }}
                                  >
                                    <PencilIcon className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Chỉnh sửa thông tin</TooltipContent>
                              </Tooltip>

                              {user.id !== currentUser?.id && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => {
                                        setSelectedUser(user)
                                        setDeleteOpen(true)
                                      }}
                                    >
                                      <Trash2Icon className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Xóa tài khoản vĩnh viễn</TooltipContent>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {meta && meta.total_pages > 1 && (
              <div className="flex items-center justify-between py-2">
                <div className="text-xs text-muted-foreground">
                  Hiển thị <span className="font-medium text-foreground">{(meta.page - 1) * meta.page_size + 1}</span> - <span className="font-medium text-foreground">{Math.min(meta.page * meta.page_size, meta.total_items)}</span> trong <span className="font-medium text-foreground">{meta.total_items}</span> tài khoản
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
                        text="Trước"
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
                        text="Sau"
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
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* EDIT DIALOG */}
      <EditUserDialog open={editOpen} onOpenChange={setEditOpen} user={selectedUser} />

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa Tài khoản"
        description={`Bạn có chắc chắn muốn xóa tài khoản "${selectedUser?.name}" (${selectedUser?.email}) vĩnh viễn khỏi hệ thống không?`}
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {/* PERMISSIONS DIALOG */}
      <PermissionsDialog
        open={permDialogOpen}
        onOpenChange={setPermDialogOpen}
        title={`Phân quyền Tài khoản: ${selectedUser?.name}`}
        description="Gán quyền cá nhân cho tài khoản này."
        initialPermissions={userPerms || []}
        isLoadingInitial={isLoadingUserPerms}
        onSave={handleSavePermissions}
      />
    </div>
  )
}
