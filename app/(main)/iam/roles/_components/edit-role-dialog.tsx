"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Loader2Icon } from "lucide-react"
import { useUpdateRole } from "@/hooks/iam/use-roles"
import type { Role } from "@/services/iam.service"

const roleFormSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên vai trò"),
  description: z.string().min(1, "Vui lòng nhập mô tả"),
})

type RoleFormValues = z.infer<typeof roleFormSchema>

interface EditRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
}

export function EditRoleDialog({ open, onOpenChange, role }: EditRoleDialogProps) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const updateMutation = useUpdateRole()

  // Update form values when role data changes
  useEffect(() => {
    if (open && role) {
      form.reset({
        name: role.name,
        description: role.description,
      })
    }
  }, [open, role, form])

  function onSubmit(values: RoleFormValues) {
    if (!role) return
    updateMutation.mutate(
      { roleId: role.id, payload: values },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Vai trò</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin định danh cho vai trò <strong>{role?.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <form id="edit-role-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Tên vai trò <span className="text-destructive">*</span></FieldLabel>
                  <Input placeholder="Ví dụ: Editor, Viewer..." {...field} aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Mô tả <span className="text-destructive">*</span></FieldLabel>
                  <Textarea 
                    placeholder="Mô tả ngắn gọn về quyền hạn của vai trò này..." 
                    className="resize-none h-24"
                    {...field} 
                    aria-invalid={fieldState.invalid} 
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
          <Button type="submit" form="edit-role-form" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
