"use client"

import { useState } from "react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { IamUser } from "@/lib/types/iam"

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: IamUser | null
  onSave: (data: { name: string; email: string; password: string; status: "active" | "locked" }) => void
}

export function UserFormDialog({ open, onOpenChange, user, onSave }: UserFormDialogProps) {
  const isEdit = Boolean(user)
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [password, setPassword] = useState("")
  const [isActive, setIsActive] = useState(user?.status !== "locked")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when dialog opens with new user
  function resetForm() {
    setName(user?.name ?? "")
    setEmail(user?.email ?? "")
    setPassword("")
    setIsActive(user?.status !== "locked")
    setErrors({})
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Tên không được để trống"
    if (!email.trim()) {
      errs.email = "Email không được để trống"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Email không đúng định dạng"
    }
    if (!isEdit && !password.trim()) {
      errs.password = "Mật khẩu không được để trống"
    } else if (password && password.length < 6) {
      errs.password = "Mật khẩu phải từ 6 ký tự"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSave({
      name: name.trim(),
      email: email.trim(),
      password,
      status: isActive ? "active" : "locked",
    })
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin tài khoản người dùng."
              : "Điền thông tin để tạo tài khoản mới trong hệ thống."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="iam-user-name">Họ và tên <span className="text-destructive">*</span></Label>
            <Input
              id="iam-user-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })) }}
              placeholder="Nguyễn Văn A"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="grid gap-1.5">
            <Label htmlFor="iam-user-email">Email <span className="text-destructive">*</span></Label>
            <Input
              id="iam-user-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })) }}
              placeholder="user@vpcp.gov.vn"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="grid gap-1.5">
            <Label htmlFor="iam-user-password">
              Mật khẩu {!isEdit && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="iam-user-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })) }}
              placeholder={isEdit ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Trạng thái tài khoản</p>
              <p className="text-xs text-muted-foreground">
                {isActive ? "Tài khoản đang hoạt động" : "Tài khoản đang bị khóa"}
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">Hủy</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>{isEdit ? "Cập nhật" : "Tạo mới"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
