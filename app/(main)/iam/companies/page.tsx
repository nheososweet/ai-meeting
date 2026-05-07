"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "@/hooks/use-debounce"
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
import type { Company } from "@/lib/types/iam"
import { useAuth } from "@/lib/auth/auth-context"
import { EmptyState } from "@/components/iam/shared/empty-state"
import { PermissionsDialog } from "@/components/iam/shared/permissions-dialog"
import { ConfirmDialog } from "@/components/iam/shared/confirm-dialog"
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
  const { hasPermission } = useAuth()
  
  // Checking permission
  const canManage = hasPermission("manage_companies")

  // State
  const [createOpen, setCreateOpen] = useState(false)
  const [permDialogOpen, setPermDialogOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  // Search & Pagination State
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 500)

  // Reset to page 1 when searching
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // Hooks
  const { data, isLoading, error } = useCompanies({ 
    page, 
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

      <div className="flex-1 overflow-y-auto p-5">
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
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
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
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

            {/* Pagination Controls */}
            {meta && meta.total_pages > 1 && (
              <div className="flex items-center justify-between py-2">
                <div className="text-xs text-muted-foreground">
                  Hiển thị <span className="font-medium text-foreground">{(meta.page - 1) * meta.page_size + 1}</span> - <span className="font-medium text-foreground">{Math.min(meta.page * meta.page_size, meta.total_items)}</span> trong <span className="font-medium text-foreground">{meta.total_items}</span> tổ chức
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
                    
                    {/* Simple page numbers logic */}
                    {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map((p) => {
                      // Only show current, first, last, and neighbors
                      if (
                        p === 1 || 
                        p === meta.total_pages || 
                        (p >= meta.page - 1 && p <= meta.page + 1)
                      ) {
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
                        return (
                          <PaginationItem key={p}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
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
