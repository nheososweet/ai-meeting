"use client"

import { useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { EditIcon, LockIcon, PlusIcon, ShieldIcon, UnlockIcon } from "lucide-react"
import { IamSearchBar } from "@/components/iam/shared/iam-search-bar"
import { StatusBadge } from "@/components/iam/shared/status-badge"
import { EmptyState } from "@/components/iam/shared/empty-state"
import { UserFormDialog } from "@/components/iam/users/user-form-dialog"
import { UserLockDialog } from "@/components/iam/users/user-lock-dialog"
import { UserRoleAssign } from "@/components/iam/users/user-role-assign"
import { useAuth } from "@/lib/auth/auth-context"
import { IAM_PERMISSIONS } from "@/lib/auth/permissions"
import { mockUsers, mockRoles } from "@/lib/mock/iam"
import type { IamUser, UserStatus } from "@/lib/types/iam"

const PAGE_SIZE = 10

export default function UsersPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission(IAM_PERMISSIONS.USERS_CREATE)
  const canEdit = hasPermission(IAM_PERMISSIONS.USERS_EDIT)
  const canLock = hasPermission(IAM_PERMISSIONS.USERS_LOCK)

  const [users, setUsers] = useState<IamUser[]>(mockUsers)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all")
  const [page, setPage] = useState(1)

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<IamUser | null>(null)
  const [lockUser, setLockUser] = useState<IamUser | null>(null)
  const [lockOpen, setLockOpen] = useState(false)
  const [roleAssignUser, setRoleAssignUser] = useState<IamUser | null>(null)
  const [roleAssignOpen, setRoleAssignOpen] = useState(false)

  // Filtering
  const filtered = useMemo(() => {
    let result = users
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter)
    }
    return result
  }, [users, search, statusFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Handlers
  function handleCreateUser(data: { name: string; email: string; password: string; status: "active" | "locked" }) {
    const newUser: IamUser = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      status: data.status,
      createdAt: new Date().toISOString(),
      roleIds: [],
      groupIds: [],
    }
    setUsers((prev) => [newUser, ...prev])
  }

  function handleEditUser(data: { name: string; email: string; password: string; status: "active" | "locked" }) {
    if (!editingUser) return
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id ? { ...u, name: data.name, email: data.email, status: data.status } : u
      )
    )
    setEditingUser(null)
  }

  function handleToggleLock() {
    if (!lockUser) return
    setUsers((prev) =>
      prev.map((u) =>
        u.id === lockUser.id ? { ...u, status: u.status === "active" ? "locked" : "active" } : u
      )
    )
    setLockOpen(false)
    setLockUser(null)
  }

  function handleSaveRoles(roleIds: string[]) {
    if (!roleAssignUser) return
    setUsers((prev) =>
      prev.map((u) => (u.id === roleAssignUser.id ? { ...u, roleIds } : u))
    )
    setRoleAssignUser(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      {/* Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 rounded-lg border border-border/80 bg-card px-4 py-3 shadow-sm">
        <IamSearchBar
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
        />

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as "all" | UserStatus); setPage(1) }}>
          <SelectTrigger className="h-9 w-[140px] text-sm">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="locked">Đã khóa</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {canCreate && (
          <Button
            size="sm"
            onClick={() => { setEditingUser(null); setFormOpen(true) }}
          >
            <PlusIcon className="mr-1.5 size-4" />
            Tạo mới
          </Button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState emptyText="Không tìm thấy tài khoản nào phù hợp." />
      ) : (
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Họ và tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[110px] text-center">Trạng thái</TableHead>
                <TableHead className="w-[120px]">Ngày tạo</TableHead>
                <TableHead className="w-[140px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Chỉnh sửa"
                          onClick={() => { setEditingUser(user); setFormOpen(true) }}
                        >
                          <EditIcon className="size-4" />
                        </Button>
                      )}
                      {canLock && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title={user.status === "active" ? "Khóa" : "Mở khóa"}
                          onClick={() => { setLockUser(user); setLockOpen(true) }}
                        >
                          {user.status === "active" ? (
                            <LockIcon className="size-4 text-destructive" />
                          ) : (
                            <UnlockIcon className="size-4 text-emerald-600" />
                          )}
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Gán vai trò"
                          onClick={() => { setRoleAssignUser(user); setRoleAssignOpen(true) }}
                        >
                          <ShieldIcon className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="shrink-0 flex items-center justify-between border-t border-border/60 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length}
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage(Math.max(1, safePage - 1)) }}
                      className={safePage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === safePage}
                        onClick={(e) => { e.preventDefault(); setPage(p) }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); setPage(Math.min(totalPages, safePage + 1)) }}
                      className={safePage >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        onSave={editingUser ? handleEditUser : handleCreateUser}
      />
      <UserLockDialog
        open={lockOpen}
        onOpenChange={setLockOpen}
        user={lockUser}
        onConfirm={handleToggleLock}
      />
      {roleAssignUser && (
        <UserRoleAssign
          open={roleAssignOpen}
          onOpenChange={setRoleAssignOpen}
          assignedRoleIds={roleAssignUser.roleIds}
          allRoles={mockRoles}
          userName={roleAssignUser.name}
          onSave={handleSaveRoles}
        />
      )}
    </div>
  )
}
