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
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DownloadIcon, FileIcon, Trash2Icon, ImageIcon, FileTextIcon, VideoIcon } from "lucide-react"
import { IamSearchBar } from "@/components/iam/shared/iam-search-bar"
import { EmptyState } from "@/components/iam/shared/empty-state"
import { ConfirmDialog } from "@/components/iam/shared/confirm-dialog"
import { FileUploadZone } from "@/components/wbs/files/file-upload-zone"
import { FolderPermissions } from "@/components/wbs/files/folder-permissions"
import { useAuth } from "@/lib/auth/auth-context"
import { PERMISSIONS } from "@/lib/types/iam"
import { mockFiles, mockProjects } from "@/lib/mock/wbs"
import { mockUsers } from "@/lib/mock/iam"
import type { WbsFile } from "@/lib/types/wbs"
import { DataTablePagination, type PaginationMeta } from "@/components/ui/data-table-pagination"
import { usePaginationState } from "@/hooks/use-pagination"

const PAGE_SIZE = 20

export default function FilesPage() {
  const { hasPermission } = useAuth()
  const canUpload = hasPermission(PERMISSIONS.ASSIGN_FILES)
  const canDelete = hasPermission(PERMISSIONS.ASSIGN_FILES)

  const [files, setFiles] = useState<WbsFile[]>(mockFiles)
  const [search, setSearch] = useState("")
  const [deleteFile, setDeleteFile] = useState<WbsFile | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { page, setPage } = usePaginationState([search], PAGE_SIZE)

  // Filtering
  const filtered = useMemo(() => {
    let result = files
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((f) => f.name.toLowerCase().includes(q))
    }
    return result
  }, [files, search])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const clientMeta: PaginationMeta = {
    page: safePage,
    page_size: PAGE_SIZE,
    total_items: filtered.length,
    total_pages: totalPages,
    has_next: safePage < totalPages,
    has_prev: safePage > 1,
  }

  // Helpers
  function getProjectName(projectId: string) {
    return mockProjects.find((p) => p.id === projectId)?.name || projectId
  }

  function getUserName(id: string) {
    return mockUsers.find((u) => u.id === id)?.name || id
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  function getFileIcon(mimeType: string) {
    if (mimeType.includes("image")) return <ImageIcon className="size-4 text-blue-500" />
    if (mimeType.includes("video")) return <VideoIcon className="size-4 text-purple-500" />
    if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("sheet")) return <FileTextIcon className="size-4 text-amber-500" />
    return <FileIcon className="size-4 text-muted-foreground" />
  }

  // Handlers
  function handleUploadComplete(file: File) {
    const newFile: WbsFile = {
      id: `file-${Date.now()}`,
      projectId: "proj-1", // mock default project
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      uploadedBy: "user-1", // mock current user
      uploadedAt: new Date().toISOString(),
      s3Key: `mock/${file.name}`,
    }
    setFiles((prev) => [newFile, ...prev])
  }

  function handleDeleteConfirm() {
    if (!deleteFile) return
    setFiles((prev) => prev.filter((f) => f.id !== deleteFile.id))
    setDeleteOpen(false)
    setDeleteFile(null)
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <Tabs defaultValue="files" className="flex flex-1 min-h-0 flex-col gap-4">
        <div className="shrink-0 flex items-center justify-between border-b border-border/60 pb-2 px-2">
          <TabsList className="bg-transparent p-0">
            <TabsTrigger
              value="files"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2"
            >
              Quản lý Tệp tin
            </TabsTrigger>
            <TabsTrigger
              value="permissions"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2"
            >
              Phân quyền thư mục
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="files" className="flex flex-1 min-h-0 flex-col gap-4 mt-0">
          {/* Upload Zone */}
          {canUpload && (
            <div className="shrink-0">
              <FileUploadZone onUploadComplete={handleUploadComplete} />
            </div>
          )}

          {/* Toolbar */}
          <div className="shrink-0 flex items-center gap-3 rounded-lg border border-border/80 bg-card px-4 py-3 shadow-sm">
            <IamSearchBar
              placeholder="Tìm tên tệp tin..."
              value={search}
              onChange={(v) => setSearch(v)}
            />
            <div className="flex-1" />
            <div className="text-sm text-muted-foreground font-medium">
              Tổng số: {filtered.length} tệp
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <EmptyState emptyText="Không tìm thấy tệp tin nào." />
          ) : (
            <div className="flex-1 min-h-0 [&>div]:h-full [&>div]:overflow-auto [&>div]:rounded-md [&>div]:border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background sticky top-0">
                      <TableHead className="w-[300px]">Tên tệp</TableHead>
                      <TableHead className="w-[180px]">Dự án</TableHead>
                      <TableHead className="w-[100px] text-right">Kích thước</TableHead>
                      <TableHead className="w-[160px]">Người tải lên</TableHead>
                      <TableHead className="w-[140px]">Ngày tải</TableHead>
                      <TableHead className="w-[120px] text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded bg-muted">
                              {getFileIcon(file.mimeType)}
                            </div>
                            <span className="font-medium truncate max-w-[240px]" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground truncate max-w-[160px] block" title={getProjectName(file.projectId)}>
                            {getProjectName(file.projectId)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {formatSize(file.size)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getUserName(file.uploadedBy)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(file.uploadedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-8" title="Tải xuống">
                              <DownloadIcon className="size-4 text-muted-foreground" />
                            </Button>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                title="Xóa tệp"
                                onClick={() => { setDeleteFile(file); setDeleteOpen(true) }}
                              >
                                <Trash2Icon className="size-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="flex flex-1 min-h-0 flex-col mt-0">
          <FolderPermissions />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa tệp tin"
        description={deleteFile ? `Bạn có chắc chắn muốn xóa tệp "${deleteFile.name}"? Hành động này không thể hoàn tác.` : ""}
        confirmLabel="Xóa tệp"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
