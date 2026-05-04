"use client"

import { ConfirmDialog } from "@/components/iam/shared/confirm-dialog"
import type { IamUser } from "@/lib/types/iam"

interface UserLockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: IamUser | null
  onConfirm: () => void
}

export function UserLockDialog({ open, onOpenChange, user, onConfirm }: UserLockDialogProps) {
  if (!user) return null

  const isLocking = user.status === "active"

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isLocking ? "Khóa tài khoản" : "Mở khóa tài khoản"}
      description={
        isLocking
          ? `Bạn có chắc chắn muốn khóa tài khoản "${user.name}"? Người dùng sẽ không thể đăng nhập sau khi bị khóa.`
          : `Bạn có chắc chắn muốn mở khóa tài khoản "${user.name}"? Người dùng sẽ có thể đăng nhập lại.`
      }
      confirmLabel={isLocking ? "Khóa" : "Mở khóa"}
      variant={isLocking ? "destructive" : "default"}
      onConfirm={onConfirm}
    />
  )
}
