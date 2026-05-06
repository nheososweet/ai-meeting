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
import { Loader2Icon } from "lucide-react"
import { useCreateCompany, useUpdateCompany } from "@/hooks/iam/use-companies"
import type { Company } from "@/lib/types/iam"

const companySchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên tổ chức"),
})

type CompanyFormValues = z.infer<typeof companySchema>

interface CreateCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCompanyDialog({ open, onOpenChange }: CreateCompanyDialogProps) {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: "" },
  })

  const createMutation = useCreateCompany()

  useEffect(() => {
    if (!open) form.reset()
  }, [open, form])

  function onSubmit(values: CompanyFormValues) {
    createMutation.mutate(values.name.trim(), {
      onSuccess: () => onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm Tổ chức mới</DialogTitle>
          <DialogDescription>
            Tạo một tổ chức mới trong hệ thống để quản lý người dùng và phòng ban.
          </DialogDescription>
        </DialogHeader>
        
        <form id="create-company-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Tên tổ chức <span className="text-destructive">*</span></FieldLabel>
                  <Input placeholder="VD: Công ty Sphinx" {...field} aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Hủy</Button>
          </DialogClose>
          <Button type="submit" form="create-company-form" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Tạo mới
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface EditCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company | null
}

export function EditCompanyDialog({ open, onOpenChange, company }: EditCompanyDialogProps) {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: "" },
  })

  const updateMutation = useUpdateCompany()

  useEffect(() => {
    if (open && company) {
      form.reset({ name: company.name })
    }
  }, [open, company, form])

  function onSubmit(values: CompanyFormValues) {
    if (!company) return
    updateMutation.mutate(
      { id: company.id, name: values.name.trim() },
      {
        onSuccess: () => onOpenChange(false),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Tổ chức</DialogTitle>
          <DialogDescription>
            Thay đổi thông tin của tổ chức trong hệ thống.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-company-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Tên tổ chức <span className="text-destructive">*</span></FieldLabel>
                  <Input placeholder="VD: Công ty Sphinx" {...field} aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Hủy</Button>
          </DialogClose>
          <Button type="submit" form="edit-company-form" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
