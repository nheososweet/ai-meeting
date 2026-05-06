"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2Icon, UserPlusIcon, FolderIcon, UserIcon, UsersIcon } from "lucide-react"
import { mockFolderPermissions, mockProjects } from "@/lib/mock/wbs"
import { mockUsers, mockGroups } from "@/lib/mock/iam"
import type { FolderPermission, FolderPermissionType } from "@/lib/types/wbs"
import { useAuth } from "@/lib/auth/auth-context"
import { PERMISSIONS } from "@/lib/types/iam"

export function FolderPermissions() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission(PERMISSIONS.ASSIGN_FILES)
  
  const [permissions, setPermissions] = useState<FolderPermission[]>(mockFolderPermissions)

  function getTargetName(type: "user" | "group", id: string) {
    if (type === "user") return mockUsers.find((u) => u.id === id)?.name || id
    return mockGroups.find((g) => g.id === id)?.name || id
  }

  function handleTogglePerm(permId: string, type: FolderPermissionType) {
    if (!canManage) return
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.id === permId) {
          const has = p.permissions.includes(type)
          return {
            ...p,
            permissions: has
              ? p.permissions.filter((x) => x !== type)
              : [...p.permissions, type],
          }
        }
        return p
      })
    )
  }

  function handleDelete(id: string) {
    setPermissions((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Phân quyền Thư mục (Storage)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý quyền truy cập tệp tin (Đọc/Ghi/Xóa) theo thư mục Dự án
          </p>
        </div>
        {canManage && (
          <Button size="sm">
            <UserPlusIcon className="mr-1.5 size-4" />
            Gán quyền mới
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Thư mục (Dự án)</TableHead>
              <TableHead className="w-[200px]">Người dùng / Nhóm</TableHead>
              <TableHead className="text-center w-[80px]">Đọc</TableHead>
              <TableHead className="text-center w-[80px]">Ghi</TableHead>
              <TableHead className="text-center w-[80px]">Xóa</TableHead>
              <TableHead className="text-right w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  Chưa có phân quyền nào được thiết lập.
                </TableCell>
              </TableRow>
            ) : (
              permissions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FolderIcon className="size-4 text-muted-foreground" />
                      <span className="font-medium">{p.folderName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {p.targetType === "user" ? <UserIcon className="size-4" /> : <UsersIcon className="size-4" />}
                      <span>{getTargetName(p.targetType, p.targetId)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={p.permissions.includes("read")}
                      onCheckedChange={() => handleTogglePerm(p.id, "read")}
                      disabled={!canManage}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={p.permissions.includes("write")}
                      onCheckedChange={() => handleTogglePerm(p.id, "write")}
                      disabled={!canManage}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={p.permissions.includes("delete")}
                      onCheckedChange={() => handleTogglePerm(p.id, "delete")}
                      disabled={!canManage}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2Icon className="size-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
