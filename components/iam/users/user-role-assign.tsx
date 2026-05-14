"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { XIcon, PlusIcon, SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { IamRole } from "@/lib/types/iam"

interface UserRoleAssignProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignedRoleIds: string[]
  allRoles: IamRole[]
  userName: string
  onSave: (roleIds: string[]) => void
}

export function UserRoleAssign({
  open,
  onOpenChange,
  assignedRoleIds,
  allRoles,
  userName,
  onSave,
}: UserRoleAssignProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(assignedRoleIds)
  const [search, setSearch] = useState("")

  function handleOpen(v: boolean) {
    if (v) {
      setSelectedIds(assignedRoleIds)
      setSearch("")
    }
    onOpenChange(v)
  }

  function toggleRole(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  function removeRole(id: string) {
    setSelectedIds((prev) => prev.filter((r) => r !== id))
  }

  const filteredRoles = allRoles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  )

  const assignedRoles = allRoles.filter((r) => selectedIds.includes(r.id))

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gán vai trò cho {userName}</DialogTitle>
          <DialogDescription>Chọn các vai trò cần gán cho người dùng này.</DialogDescription>
        </DialogHeader>

        {/* Assigned roles */}
        {assignedRoles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {assignedRoles.map((role) => (
              <Badge key={role.id} variant="secondary" className="gap-1 pr-1">
                {role.name}
                <button
                  type="button"
                  onClick={() => removeRole(role.id)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm vai trò..."
            className="h-9 pl-8 text-sm"
          />
        </div>

        {/* Role list */}
        <div className="max-h-[240px] overflow-y-auto rounded-md border border-border">
          {filteredRoles.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy vai trò.</p>
          ) : (
            filteredRoles.map((role) => {
              const isSelected = selectedIds.includes(role.id)
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRole(role.id)}
                  className={`flex w-full items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-b-0 ${
                    isSelected ? "bg-primary/5" : "hover:bg-muted/40"
                  }`}
                >
                  <div
                    className={`flex size-5 shrink-0 items-center justify-center rounded border text-xs transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {isSelected && <PlusIcon className="size-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{role.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{role.description}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">Hủy</Button>
          </DialogClose>
          <Button onClick={() => { onSave(selectedIds); onOpenChange(false) }}>
            Lưu ({selectedIds.length} vai trò)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
