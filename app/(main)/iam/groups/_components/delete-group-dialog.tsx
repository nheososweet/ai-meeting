"use client"

import * as React from "react"
import { useInView } from "react-intersection-observer"
import { AlertTriangleIcon, UsersIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useInfiniteUsers } from "@/hooks/iam/use-users"
import type { Group } from "@/lib/types/iam"

interface DeleteGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group | null
  onConfirm: () => void
  loading?: boolean
}

export function DeleteGroupDialog({
  open,
  onOpenChange,
  group,
  onConfirm,
  loading = false,
}: DeleteGroupDialogProps) {
  const { ref: sentinelRef, inView } = useInView({ threshold: 0 })

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteUsers({
    search_groupid: group?.id,
    page_size: 10,
    enabled: open && !!group,
  })

  const users = React.useMemo(
    () => usersData?.pages.flatMap((p) => p.data) ?? [],
    [usersData]
  )
  const totalUsers = usersData?.pages[0]?.meta.total_items

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 mt-0.5">
              <AlertTriangleIcon className="size-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Xóa nhóm &quot;{group?.name}&quot;</DialogTitle>
              <DialogDescription className="mt-1">
                Hành động này không thể hoàn tác. Nhóm con và tất cả thành viên sẽ bị xóa khỏi nhóm này.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-1">
          <div className="flex items-center gap-2 mb-2">
            <UsersIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Thành viên trong nhóm</span>
            {isLoadingUsers ? (
              <span className="text-xs text-muted-foreground">Đang tải...</span>
            ) : (
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {totalUsers ?? 0} người
              </Badge>
            )}
          </div>

          <div className="max-h-[220px] overflow-y-auto rounded-md border border-border/60 bg-muted/20">
            {isLoadingUsers ? (
              <div className="p-2 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1">
                    <div className="size-7 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-2.5 w-44 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-sm">
                Nhóm này chưa có thành viên nào.
              </div>
            ) : (
              <div className="p-2">
                {users.map((user) => {
                  const initials = user.name
                    .split(" ")
                    .slice(-2)
                    .map((w) => w[0]?.toUpperCase() ?? "")
                    .join("")
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-sm hover:bg-muted/50"
                    >
                      <div className="size-7 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  )
                })}

                {/* Sentinel kích hoạt load thêm khi scroll tới cuối */}
                <div ref={sentinelRef} className="h-px" />

                {isFetchingNextPage && (
                  <div className="flex justify-center py-2">
                    <div className="size-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hiển thị số trang đã load / tổng nếu có nhiều trang */}
          {!isLoadingUsers && (totalUsers ?? 0) > users.length && (
            <p className="text-xs text-muted-foreground mt-1.5 text-right">
              Đang hiển thị {users.length}/{totalUsers} thành viên — cuộn xuống để tải thêm
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Đang xóa..." : "Xóa nhóm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
