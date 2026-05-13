"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { usePaginationState } from "@/hooks/use-pagination"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
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
  const [filterCompanyId, setFilterCompanyId] = useState<string>("")
  const [filterGroupId, setFilterGroupId] = useState<string>("")
  const [filterActive, setFilterActive] = useState<string>("all")
  const debouncedSearch = useDebounce(search, 500)

  const { page, setPage, pageSize } = usePaginationState([debouncedSearch, filterCompanyId, filterGroupId, filterActive])

  // Tự động set filter công ty cho người không phải admin
  useEffect(() => {
    if (!isAdmin && currentUser?.companyId) {
      setFilterCompanyId(String(currentUser.companyId))
    }
  }, [isAdmin, currentUser])

  // --- Data Fetching ---
  const { data: usersData, isLoading: isLoadingUsers, isFetching } = useUsers({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    search_companyid: isAdmin
      ? (filterCompanyId !== "" ? Number(filterCompanyId) : undefined)
      : currentUser?.companyId || undefined,
    search_groupid: filterGroupId !== "" ? Number(filterGroupId) : undefined,
    is_active: filterActive === "true" ? true : filterActive === "false" ? false : undefined,
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

        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="h-9 w-full sm:w-[160px] text-xs">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Tất cả trạng thái</SelectItem>
            <SelectItem value="true" className="text-xs font-medium text-emerald-600">Đang hoạt động</SelectItem>
            <SelectItem value="false" className="text-xs font-medium text-red-600">Đang bị khóa</SelectItem>
          </SelectContent>
        </Select>

        {(search || filterCompanyId !== "" || filterGroupId !== "" || filterActive !== "all") && (
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
              setFilterActive("all")
            }}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            <FilterXIcon className="mr-1.5 size-3.5" /> Xóa bộ lọc
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoadingUsers ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState emptyText={search || filterCompanyId !== "all" ? "Không tìm thấy kết quả nào khớp với bộ lọc." : "Chưa có tài khoản nào trong hệ thống."} />
        ) : (
          <>
            <div className="flex-1 min-h-0 p-4 [&>div]:h-full [&>div]:overflow-auto [&>div]:rounded-md [&>div]:border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background sticky top-0">
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
                          {(typeof user.role === 'object' ? user.role.name : user.role) === "admin" && (
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
                          <div className="flex items-center justify-end gap-1">
                            {hasPermission("assign_permissions") && user.scope !== "global" && user.id !== currentUser?.id && (
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
                                {user.id !== currentUser?.id && (
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
                                )}

                                {user.id !== currentUser?.id && (
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
                                )}

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

            <DataTablePagination
              meta={meta!}
              onPageChange={setPage}
              itemLabel="tài khoản"
              isFetching={isFetching}
              className="shrink-0 px-4 pb-4"
            />
          </>
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
