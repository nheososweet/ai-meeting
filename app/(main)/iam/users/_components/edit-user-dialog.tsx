"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { IAMCombobox } from "@/components/iam/shared/iam-combobox"
import { Loader2Icon } from "lucide-react"
import { useUpdateUser } from "@/hooks/iam/use-users"
import { useInfiniteCompanies } from "@/hooks/iam/use-companies"
import { useInfiniteGroups } from "@/hooks/iam/use-groups"
import type { AuthMeResponse } from "@/lib/types/iam"

const editUserFormSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập họ và tên"),
  email: z.string().email("Email không hợp lệ").min(1, "Vui lòng nhập email"),
  password: z.string().optional().refine((val) => !val || val.length >= 8, {
    message: "Mật khẩu phải có ít nhất 8 ký tự nếu nhập",
  }),
  role: z.enum(["admin", "member"]),
  scope: z.enum(["global", "company", "group"]),
  companyId: z.string().min(1, "Vui lòng chọn tổ chức"),
  groupId: z.string().optional(),
})

type EditUserFormValues = z.infer<typeof editUserFormSchema>

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AuthMeResponse | null
}

export function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "member",
      scope: "global",
      companyId: "",
      groupId: "",
    },
  })

  // Update form values when user data changes
  useEffect(() => {
    if (open && user) {
      form.reset({
        name: user.name,
        email: user.email,
        password: "", // Always empty initially for security
        role: user.role,
        scope: user.scope || "global",
        companyId: user.company_id ? String(user.company_id) : "",
        groupId: user.group_id ? String(user.group_id) : "",
      })
    }
  }, [open, user, form])

  // --- Data Fetching ---
  const selectedCompanyId = form.watch("companyId")
  const parsedCompanyId = selectedCompanyId && selectedCompanyId !== "" ? Number(selectedCompanyId) : null
  const selectedRole = form.watch("role")

  // --- Mutations ---
  const updateMutation = useUpdateUser()

  function onSubmit(values: EditUserFormValues) {
    if (!user) return

    updateMutation.mutate(
      {
        userId: user.id,
        payload: {
          name: values.name,
          password: values.password || undefined,
          role: values.role,
          scope: values.role === "admin" ? values.scope : null,
          company_id: Number(values.companyId),
          group_id: values.groupId ? Number(values.groupId) : null,
          // Note: permissions field can be added here if needed to be updated simultaneously
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Tài khoản</DialogTitle>
          <DialogDescription>Cập nhật thông tin chi tiết cho tài khoản <strong>{user?.email}</strong>.</DialogDescription>
        </DialogHeader>
        
        <form id="edit-user-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Họ và tên <span className="text-destructive">*</span></FieldLabel>
                    <Input placeholder="Tên hiển thị..." {...field} aria-invalid={fieldState.invalid} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Vai trò <span className="text-destructive">*</span></FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Thành viên (Member)</SelectItem>
                        <SelectItem value="admin">Quản trị (Admin)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="opacity-70">
                    <FieldLabel>Email</FieldLabel>
                    <Input type="email" placeholder="Email..." {...field} disabled aria-invalid={fieldState.invalid} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Mật khẩu mới</FieldLabel>
                    <Input type="password" placeholder="Bỏ trống nếu không đổi..." {...field} aria-invalid={fieldState.invalid} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <div className="border-t border-border/60 my-1"></div>

            {selectedRole === "admin" && (
              <Controller
                name="scope"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Cấp độ truy cập (Scope) <span className="text-destructive">*</span></FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global (Toàn quyền hệ thống)</SelectItem>
                        <SelectItem value="company">Company (Quản lý cấp Công ty)</SelectItem>
                        <SelectItem value="group">Group (Chỉ truy cập cấp Nhóm/Phòng ban)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )}

            <Controller
              name="companyId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Tổ chức / Công ty <span className="text-destructive">*</span></FieldLabel>
                  <IAMCombobox
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val)
                      form.setValue("groupId", "")
                    }}
                    placeholder="Chọn tổ chức..."
                    searchPlaceholder="Tìm tên tổ chức..."
                    useInfiniteHook={useInfiniteCompanies}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="groupId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Phòng ban / Nhóm</FieldLabel>
                  <IAMCombobox
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Chọn nhóm..."
                    searchPlaceholder="Tìm tên nhóm..."
                    disabled={!selectedCompanyId}
                    useInfiniteHook={(params: any) => useInfiniteGroups(parsedCompanyId, params)}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">Hủy</Button>
          </DialogClose>
          <Button type="submit" form="edit-user-form" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
