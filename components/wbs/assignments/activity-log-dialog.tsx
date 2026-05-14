"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { WbsAssignment } from "@/lib/types/wbs"
import { mockUsers } from "@/lib/mock/iam"
import { WbsStatusBadge } from "../shared/wbs-status-badge"
import { ArrowRightIcon } from "lucide-react"

interface ActivityLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: WbsAssignment | null
}

export function ActivityLogDialog({
  open,
  onOpenChange,
  assignment,
}: ActivityLogDialogProps) {
  if (!assignment) return null

  function getUserName(id: string) {
    return mockUsers.find((u) => u.id === id)?.name || id
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lịch sử thay đổi trạng thái</DialogTitle>
          <DialogDescription>
            {assignment.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] mt-4">
          {assignment.statusHistory.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              Chưa có lịch sử thay đổi nào.
            </div>
          ) : (
            <div className="relative border-l-2 border-border/60 ml-4 pl-6 space-y-6 py-2">
              {assignment.statusHistory.map((history, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-card" />
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {getUserName(history.changedBy)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        đã cập nhật vào {formatDate(history.changedAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <WbsStatusBadge status={history.from} />
                      <ArrowRightIcon className="size-4 text-muted-foreground" />
                      <WbsStatusBadge status={history.to} />
                    </div>

                    {history.note && (
                      <div className="mt-2 text-sm text-foreground bg-muted/30 p-2.5 rounded-md border border-border/50">
                        {history.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
