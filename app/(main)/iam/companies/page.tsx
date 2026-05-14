"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { usePaginationState } from "@/hooks/use-pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PlusIcon, ShieldIcon, BuildingIcon, Loader2Icon, SearchIcon, ChevronLeft, ChevronRight, PencilIcon, Trash2Icon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { cn, formatDate } from "@/lib/utils"
import type { Company } from "@/lib/types/iam"
import { useAuth } from "@/lib/auth/auth-context"
import { AccessDenied403 } from "@/components/iam/shared/access-denied"
import { PermissionsDialog } from "@/components/iam/shared/permissions-dialog"
import { ConfirmDialog } from "@/components/iam/shared/confirm-dialog"
import { EmptyState } from "@/components/iam/shared/empty-state"
import {
  useCompanies,
  useDeleteCompany,
  useAssignCompanyPermissions,
  useCompanyPermissions,
} from "@/hooks/iam/use-companies"
import { CreateCompanyDialog, EditCompanyDialog } from "./_components/company-dialogs"

// ══════════════════════════════════════════════════════════
// Components
// ══════════════════════════════════════════════════════════

export default function CompaniesPage() {
  const { hasPermission, hasScope } = useAuth()

  // Checking permission
  const canManage = hasPermission("manage_companies") && hasScope("global")

  if (!canManage) {
    return <AccessDenied403 />
  }

  // State
  const [createOpen, setCreateOpen] = useState(false)
  const [permDialogOpen, setPermDialogOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  // Search & Pagination State
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 500)

  const { page, setPage, pageSize } = usePaginationState([debouncedSearch])

  // Hooks
  const { data, isLoading, isFetching, error } = useCompanies({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined
  })

  // Lấy danh sách quyền của công ty ĐANG ĐƯỢC CHỌN
  const { data: companyPerms, isLoading: isLoadingCompanyPerms } = useCompanyPermissions(
    permDialogOpen && selectedCompany ? selectedCompany.id : undefined
  )

  // Mutations
  const deleteMutation = useDeleteCompany()
  const assignPermsMutation = useAssignCompanyPermissions()

  function handleDelete() {
    if (!selectedCompany) return
    deleteMutation.mutate(selectedCompany.id, {
      onSuccess: () => {
        setDeleteOpen(false)
      },
    })
  }

  async function handleSavePermissions(permissions: string[]) {
    if (!selectedCompany) return
    await assignPermsMutation.mutateAsync({ companyId: selectedCompany.id, perms: permissions })
  }

  const companies = data?.data || []
  const meta = data?.meta

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4 gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground">Danh sách Tổ chức</h2>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">Quản lý các công ty và tổ chức trong hệ thống.</p>
        </div>

        {canManage && (
          <Button onClick={() => setCreateOpen(true)} size="sm" className="shrink-0">
            <PlusIcon className="mr-1.5 size-4" /> Thêm Tổ chức
          </Button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-border/40 bg-muted/5 p-4">
        <div className="relative w-full sm:w-[280px]">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tổ chức..."
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
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-40 items-center justify-center text-destructive">
            Đã có lỗi xảy ra khi tải dữ liệu tổ chức.
          </div>
        ) : companies.length === 0 ? (
          <EmptyState emptyText={search ? `Không tìm thấy tổ chức nào khớp với "${search}"` : "Chưa có tổ chức nào trong hệ thống."} />
        ) : (
          <>
            <div className="flex-1 min-h-0 p-4 [&>div]:h-full [&>div]:overflow-auto [&>div]:rounded-md [&>div]:border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background sticky top-0">
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Tên Tổ chức</TableHead>
                    <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id} className="group">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{company.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary/70 group-hover:bg-primary/10 transition-colors">
                            <BuildingIcon className="size-4" />
                          </div>
                          <span className="font-semibold text-sm text-foreground/90">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                        {formatDate(company.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasPermission("assign_permissions") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs hover:bg-primary/10 hover:text-primary"
                              onClick={() => {
                                setSelectedCompany(company)
                                setPermDialogOpen(true)
                              }}
                            >
                              <ShieldIcon className="mr-1.5 size-3.5" /> Phân quyền
                            </Button>
                          )}

                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                onClick={() => {
                                  setSelectedCompany(company)
                                  setEditOpen(true)
                                }}
                              >
                                <PencilIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setSelectedCompany(company)
                                  setDeleteOpen(true)
                                }}
                              >
                                <Trash2Icon className="size-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DataTablePagination
              meta={meta!}
              onPageChange={setPage}
              itemLabel="tổ chức"
              isFetching={isFetching}
              className="shrink-0 px-4 pb-4"
            />
          </>
        )}
      </div>

      {/* CREATE DIALOG */}
      <CreateCompanyDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* EDIT DIALOG */}
      <EditCompanyDialog open={editOpen} onOpenChange={setEditOpen} company={selectedCompany} />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa Tổ chức"
        description={`Bạn có chắc chắn muốn xóa tổ chức "${selectedCompany?.name}"? Hành động này không thể hoàn tác và có thể ảnh hưởng đến các nhóm và người dùng trực thuộc.`}
        confirmLabel="Xóa"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      {/* Permissions Dialog */}
      <PermissionsDialog
        open={permDialogOpen}
        onOpenChange={setPermDialogOpen}
        title={`Phân quyền Tổ chức: ${selectedCompany?.name}`}
        description={`Gán quyền cho tổ chức này. Tất cả thành viên trong tổ chức (scope: company/group) sẽ có thể nhận được các quyền này.`}
        initialPermissions={companyPerms || []}
        isLoadingInitial={isLoadingCompanyPerms}
        onSave={handleSavePermissions}
      />
    </div>
  )
}
