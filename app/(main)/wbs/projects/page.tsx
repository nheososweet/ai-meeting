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
import { Badge } from "@/components/ui/badge"
import { EditIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { IamSearchBar } from "@/components/iam/shared/iam-search-bar"
import { EmptyState } from "@/components/iam/shared/empty-state"
import { ConfirmDialog } from "@/components/iam/shared/confirm-dialog"
import { ProjectFormDialog } from "@/components/wbs/projects/project-form-dialog"
import { useAuth } from "@/lib/auth/auth-context"
import { PERMISSIONS } from "@/lib/types/iam"
import { mockProjects } from "@/lib/mock/wbs"
import type { WbsProject, ProjectStatus, ProjectType } from "@/lib/types/wbs"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

export default function ProjectsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission(PERMISSIONS.ASSIGN_FILES)

  const [projects, setProjects] = useState<WbsProject[]>(mockProjects)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all")
  const [page, setPage] = useState(1)

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<WbsProject | null>(null)
  const [deleteProject, setDeleteProject] = useState<WbsProject | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Filtering
  const filtered = useMemo(() => {
    let result = projects
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter)
    }
    return result
  }, [projects, search, statusFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Handlers
  function handleSaveProject(data: { name: string; description: string; type: ProjectType; status: ProjectStatus }) {
    if (editingProject) {
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? { ...p, ...data } : p))
      )
    } else {
      const newProject: WbsProject = {
        id: `proj-${Date.now()}`,
        name: data.name,
        description: data.description,
        type: data.type,
        status: data.status,
        createdAt: new Date().toISOString(),
        createdBy: "current-user", // Mock user
      }
      setProjects((prev) => [newProject, ...prev])
    }
    setEditingProject(null)
  }

  function handleDeleteConfirm() {
    if (!deleteProject) return
    setProjects((prev) => prev.filter((p) => p.id !== deleteProject.id))
    setDeleteOpen(false)
    setDeleteProject(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  function getStatusLabel(status: ProjectStatus) {
    switch (status) {
      case "active": return "Hoạt động"
      case "draft": return "Bản nháp"
      case "archived": return "Lưu trữ"
      default: return status
    }
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      {/* Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 rounded-lg border border-border/80 bg-card px-4 py-3 shadow-sm">
        <IamSearchBar
          placeholder="Tìm dự án hoặc chiến dịch..."
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
        />

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as "all" | ProjectStatus); setPage(1) }}>
          <SelectTrigger className="h-9 w-[140px] text-sm bg-white">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="draft">Bản nháp</SelectItem>
            <SelectItem value="archived">Lưu trữ</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {canManage && (
          <Button
            size="sm"
            onClick={() => { setEditingProject(null); setFormOpen(true) }}
          >
            <PlusIcon className="mr-1.5 size-4" />
            Tạo mới
          </Button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState emptyText="Không tìm thấy dự án nào phù hợp." />
      ) : (
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Tên Dự án / Chiến dịch</TableHead>
                  <TableHead className="w-[120px] text-center">Phân loại</TableHead>
                  <TableHead className="w-[120px] text-center">Trạng thái</TableHead>
                  <TableHead className="w-[140px]">Ngày tạo</TableHead>
                  <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((proj) => (
                  <TableRow key={proj.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{proj.name}</div>
                      {proj.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[280px]" title={proj.description}>
                          {proj.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[11px]">
                        {proj.type === "project" ? "Dự án" : "Chiến dịch"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] font-semibold",
                          proj.status === "active" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                          proj.status === "draft" && "bg-amber-100 text-amber-700 border-amber-200",
                          proj.status === "archived" && "bg-gray-100 text-gray-700 border-gray-200"
                        )}
                      >
                        {getStatusLabel(proj.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(proj.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Chỉnh sửa"
                            onClick={() => { setEditingProject(proj); setFormOpen(true) }}
                          >
                            <EditIcon className="size-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Xóa"
                            onClick={() => { setDeleteProject(proj); setDeleteOpen(true) }}
                          >
                            <Trash2Icon className="size-4 text-destructive" />
                          </Button>
                        </div>
                      )}
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
      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
        onSave={handleSaveProject}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa dự án"
        description={deleteProject ? `Bạn có chắc chắn muốn xóa dự án "${deleteProject.name}"? Hành động này không thể hoàn tác.` : ""}
        confirmLabel="Xóa"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
