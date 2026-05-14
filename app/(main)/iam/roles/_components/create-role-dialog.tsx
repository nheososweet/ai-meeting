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
import { Loader2Icon, PlusIcon } from "lucide-react"
import { useCreateRole } from "@/hooks/iam/use-roles"

const roleFormSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên vai trò"),
  description: z.string().min(1, "Vui lòng nhập mô tả"),
})

type RoleFormValues = z.infer<typeof roleFormSchema>

interface CreateRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoleDialog({ open, onOpenChange }: CreateRoleDialogProps) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const createMutation = useCreateRole()

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  function onSubmit(values: RoleFormValues) {
    createMutation.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Tạo Vai trò mới</DialogTitle>
          <DialogDescription>
            Định nghĩa vai trò mới và mô tả chức năng của nó trong hệ thống.
          </DialogDescription>
        </DialogHeader>
        
        <form id="create-role-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4">
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
          <Button type="submit" form="create-role-form" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Tạo vai trò
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
