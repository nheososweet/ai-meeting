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
import { useCreateGroup, useUpdateGroup, useInfiniteGroups } from "@/hooks/iam/use-groups"
import type { Group } from "@/lib/types/iam"

const groupSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên nhóm / phòng ban"),
  parentId: z.string().optional(),
})

type GroupFormValues = z.infer<typeof groupSchema>

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: number | null
  companyName: string
  groups: Group[]
  initialParentId?: string
}

export function CreateGroupDialog({ 
  open, 
  onOpenChange, 
  companyId, 
  companyName, 
  groups,
  initialParentId = "__none__"
}: CreateGroupDialogProps) {
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      parentId: initialParentId,
    },
  })

  const createMutation = useCreateGroup()

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        parentId: initialParentId,
      })
    }
  }, [open, initialParentId, form])

  function onSubmit(values: GroupFormValues) {
    if (!companyId) return
    const parentIdValue = values.parentId === "__none__" || !values.parentId ? null : Number(values.parentId)
    
    createMutation.mutate(
      { companyId, name: values.name.trim(), parentId: parentIdValue },
      {
        onSuccess: () => onOpenChange(false),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm Nhóm Mới</DialogTitle>
          <DialogDescription>
            Tạo nhóm trực thuộc tổ chức <span className="font-semibold text-foreground">{companyName}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <form id="create-group-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Tên nhóm / Phòng ban <span className="text-destructive">*</span></FieldLabel>
                  <Input placeholder="VD: Phòng Kế Toán" {...field} aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            
            <Controller
              name="parentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Trực thuộc nhóm (Tùy chọn)</FieldLabel>
                  <IAMCombobox
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Chọn nhóm cha..."
                    searchPlaceholder="Tìm tên nhóm..."
                    useInfiniteHook={(params: any) => useInfiniteGroups(companyId, params)}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">Hủy</Button>
          </DialogClose>
          <Button type="submit" form="create-group-form" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Tạo mới
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface EditGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group | null
}

export function EditGroupDialog({ open, onOpenChange, group }: EditGroupDialogProps) {
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "" },
  })

  const updateMutation = useUpdateGroup()

  useEffect(() => {
    if (open && group) {
      form.reset({ name: group.name })
    }
  }, [open, group, form])

  function onSubmit(values: GroupFormValues) {
    if (!group) return
    updateMutation.mutate(
      { id: group.id, name: values.name.trim() },
      {
        onSuccess: () => onOpenChange(false),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Nhóm</DialogTitle>
          <DialogDescription>
            Thay đổi tên của nhóm / phòng ban.
          </DialogDescription>
        </DialogHeader>
        
        <form id="edit-group-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Tên nhóm / Phòng ban <span className="text-destructive">*</span></FieldLabel>
                  <Input placeholder="VD: Phòng Kế Toán" {...field} aria-invalid={fieldState.invalid} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">Hủy</Button>
          </DialogClose>
          <Button type="submit" form="edit-group-form" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
