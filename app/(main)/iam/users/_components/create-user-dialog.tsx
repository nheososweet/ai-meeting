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
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { IAMCombobox } from "@/components/iam/shared/iam-combobox"
import { Loader2Icon, Building2Icon } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { useCreateUser } from "@/hooks/iam/use-users"
import { useInfiniteCompanies } from "@/hooks/iam/use-companies"
import { useInfiniteGroups } from "@/hooks/iam/use-groups"
import { useInfiniteRoles } from "@/hooks/iam/use-roles"

const userFormSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập họ và tên"),
  email: z.string().email("Email không hợp lệ").min(1, "Vui lòng nhập email"),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  roleId: z.string().min(1, "Vui lòng chọn vai trò"),
  companyId: z.string().min(1, "Vui lòng chọn tổ chức"),
  groupId: z.string().optional(),
})

type UserFormValues = z.infer<typeof userFormSchema>

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === "admin"

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleId: "",
      companyId: "",
      groupId: "",
    },
  })

  // --- Data Fetching ---
  const selectedCompanyId = form.watch("companyId")
  const parsedCompanyId = selectedCompanyId && selectedCompanyId !== "" ? Number(selectedCompanyId) : null

  // --- Mutations ---
  const createMutation = useCreateUser()

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset()
    } else if (!isAdmin && currentUser?.companyId) {
      // Nếu không phải admin, tự động set companyId từ user hiện tại
      form.setValue("companyId", String(currentUser.companyId))
    }
  }, [open, form, isAdmin, currentUser])

  function onSubmit(values: UserFormValues) {
    createMutation.mutate(
      {
        name: values.name,
        email: values.email,
        password: values.password,
        role_id: Number(values.roleId),
        company_id: isAdmin ? Number(values.companyId) : (currentUser?.companyId as number),
        group_id: values.groupId ? Number(values.groupId) : null,
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
          <DialogTitle>Tạo Tài khoản mới</DialogTitle>
          <DialogDescription>Nhập thông tin chi tiết để cấp tài khoản truy cập vào hệ thống.</DialogDescription>
        </DialogHeader>
        
        <form id="create-user-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4">
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
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Email <span className="text-destructive">*</span></FieldLabel>
                    <Input type="email" placeholder="Email..." {...field} aria-invalid={fieldState.invalid} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Mật khẩu <span className="text-destructive">*</span></FieldLabel>
                    <Input type="password" placeholder="Tối thiểu 8 ký tự..." {...field} aria-invalid={fieldState.invalid} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              
              <Controller
                name="roleId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Vai trò người dùng <span className="text-destructive">*</span></FieldLabel>
                    <IAMCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Chọn vai trò..."
                      searchPlaceholder="Tìm vai trò..."
                      useInfiniteHook={useInfiniteRoles}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <div className="border-t border-border/60 my-1"></div>

            {isAdmin ? (
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
            ) : currentUser?.company && (
              <Field>
                <FieldLabel>Tổ chức / Công ty</FieldLabel>
                <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-primary/5 border border-primary/10 text-primary font-medium">
                  <Building2Icon className="size-4" />
                  <span>{currentUser.company.name}</span>
                </div>
              </Field>
            )}

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
          <Button type="submit" form="create-user-form" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Tạo tài khoản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
