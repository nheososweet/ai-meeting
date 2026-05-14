"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UsersIcon, UserIcon } from "lucide-react"
import type { WbsAssignment } from "@/lib/types/wbs"
import { mockUsers, mockGroups } from "@/lib/mock/iam"

interface AssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: WbsAssignment | null
  onSave: (assignmentId: string, assigneeIds: string[]) => void
}

export function AssignDialog({
  open,
  onOpenChange,
  assignment,
  onSave,
}: AssignDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (open && assignment) {
      setSelectedIds([...assignment.assigneeIds])
    }
  }, [open, assignment])

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (assignment) {
      onSave(assignment.id, selectedIds)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Giao việc & Điều phối</DialogTitle>
            <DialogDescription>
              {assignment ? `Phân công thực hiện cho: ${assignment.name}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <ScrollArea className="h-[300px] rounded-md border border-border/60 p-4">
              <div className="space-y-4">
                {/* Groups */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Nhóm phòng ban
                  </h4>
                  <div className="space-y-2">
                    {mockGroups.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`assign-${group.id}`}
                          checked={selectedIds.includes(group.id)}
                          onCheckedChange={() => handleToggle(group.id)}
                        />
                        <label
                          htmlFor={`assign-${group.id}`}
                          className="flex items-center text-sm font-medium leading-none cursor-pointer"
                        >
                          <UsersIcon className="mr-2 size-4 text-muted-foreground" />
                          {group.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Users */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Cá nhân
                  </h4>
                  <div className="space-y-2">
                    {mockUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`assign-${user.id}`}
                          checked={selectedIds.includes(user.id)}
                          onCheckedChange={() => handleToggle(user.id)}
                        />
                        <label
                          htmlFor={`assign-${user.id}`}
                          className="flex items-center text-sm leading-none cursor-pointer"
                        >
                          <UserIcon className="mr-2 size-4 text-muted-foreground" />
                          {user.name} <span className="ml-1 text-xs text-muted-foreground">({user.email})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="mt-2 text-xs text-muted-foreground text-right">
              Đã chọn: {selectedIds.length}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu phân công</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
