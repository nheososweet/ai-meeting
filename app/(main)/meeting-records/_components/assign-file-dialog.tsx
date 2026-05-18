"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { IAMCombobox } from "@/components/iam/shared/iam-combobox"
import { ConfirmDialog } from "@/components/iam/shared/confirm-dialog"
import { useInfiniteUsers } from "@/hooks/iam/use-users"
import { AssignmentOrgTree, type SelectionItem } from "./assignment-org-tree"
import { useAssignFile } from "@/hooks/services/use-assign-file"
import { useFileHistory } from "@/hooks/services/use-file-history"
import { Loader2Icon, UserIcon, ShieldCheckIcon } from "lucide-react"

interface AssignFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: number | null
  filename?: string
  initialData?: {
    users?: SelectionItem[]
    groups: SelectionItem[]
    companies: SelectionItem[]
  }
  isReadOnly?: boolean
}

export function AssignFileDialog({
  open,
  onOpenChange,
  fileId,
  filename,
  initialData,
  isReadOnly = false,
}: AssignFileDialogProps) {
  // Form State
  const [selectedUsers, setSelectedUsers] = useState<SelectionItem[]>([])
  const [selectedGroups, setSelectedGroups] = useState<SelectionItem[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<SelectionItem[]>([])
  const [showRemoveWarning, setShowRemoveWarning] = useState(false)

  const assignMutation = useAssignFile()
  const { data: historyData } = useFileHistory(open ? fileId : null)

  // Reset/Initialize state when opening
  useEffect(() => {
    if (open) {
      if (initialData) {
        setSelectedUsers(initialData.users || [])
        setSelectedGroups(initialData.groups || [])
        setSelectedCompanies(initialData.companies || [])
      } else {
        setSelectedUsers([])
        setSelectedGroups([])
        setSelectedCompanies([])
      }
      setShowRemoveWarning(false)
    }
  }, [open, initialData])

  // Compute removed users: assignees in history that are no longer selected
  const historyAssignees = (historyData?.data ?? []).filter(h => h.user_type === "assignee")
  const removedUsers = historyAssignees.filter(h =>
    !selectedUsers.some(u => String(u.id) === String(h.user_id))
  )

  const handleUserToggle = (user: SelectionItem) => {
    if (isReadOnly) return
    setSelectedUsers((prev) =>
      prev.some(u => String(u.id) === String(user.id))
        ? prev.filter(u => String(u.id) !== String(user.id))
        : [...prev, user]
    )
  }

  const handleCompanyToggle = (company: SelectionItem) => {
    if (isReadOnly) return
    setSelectedCompanies((prev) =>
      prev.some(c => String(c.id) === String(company.id))
        ? prev.filter((v) => String(v.id) !== String(company.id))
        : [...prev, company]
    )
  }

  const handleGroupToggle = (group: SelectionItem) => {
    if (isReadOnly) return
    setSelectedGroups((prev) =>
      prev.some(g => String(g.id) === String(group.id))
        ? prev.filter((v) => String(v.id) !== String(group.id))
        : [...prev, group]
    )
  }

  const doSubmit = () => {
    if (!fileId) return
    const payload = {
      assignee_user_ids: selectedUsers.map(u => Number(u.id)),
      assignee_group_ids: selectedGroups.map(g => Number(g.id)),
      assignee_company_ids: selectedCompanies.map(c => Number(c.id)),
    }
    assignMutation.mutate(
      { fileId, payload },
      {
        onSuccess: () => {
          setShowRemoveWarning(false)
          onOpenChange(false)
        },
      }
    )
  }

  const handleSubmit = () => {
    if (!fileId || isReadOnly) return
    if (removedUsers.length > 0) {
      setShowRemoveWarning(true)
      return
    }
    doSubmit()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheckIcon className="size-5 text-primary" />
              {isReadOnly ? "Chi tiết phân phối" : "Phân phối hồ sơ"}
            </DialogTitle>
            <DialogDescription className="line-clamp-1">
              {isReadOnly
                ? `Xem danh sách nhân sự/tổ chức được cấp quyền cho tệp `
                : `Giao quyền tiếp cận tệp `
              }
              <span className="font-semibold text-foreground italic">{filename}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <FieldGroup className="space-y-6">
              {/* 1. User Section (Multi Select) */}
              <Field>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                    <UserIcon className="size-4" />
                  </div>
                  <FieldLabel className="mb-0 text-sm font-semibold">Cá nhân phụ trách</FieldLabel>
                </div>
                <IAMCombobox
                  multiple={true}
                  selectedItems={selectedUsers}
                  onToggle={handleUserToggle}
                  placeholder="Tìm kiếm người dùng..."
                  searchPlaceholder="Gõ tên hoặc email..."
                  useInfiniteHook={useInfiniteUsers}
                  className="w-full"
                  disabled={isReadOnly}
                />
              </Field>

              <div className="border-t border-border/40" />

              {/* 2. Unified Org Tree Section */}
              <AssignmentOrgTree
                selectedCompanies={selectedCompanies}
                selectedGroups={selectedGroups}
                onCompanyToggle={handleCompanyToggle}
                onGroupToggle={handleGroupToggle}
                disabled={isReadOnly}
              />
              {!isReadOnly && (
                <p className="text-xs text-muted-foreground italic">
                  * Lưu ý: Việc gán cho Công ty và Phòng ban là độc lập. Hãy check vào từng đối tượng cụ thể bạn muốn cấp quyền.
                </p>
              )}
            </FieldGroup>
          </div>

          <DialogFooter className="p-6 pt-2 border-t bg-muted/5">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={assignMutation.isPending}>
              {isReadOnly ? "Đóng" : "Hủy"}
            </Button>
            {!isReadOnly && (
              <Button onClick={handleSubmit} disabled={assignMutation.isPending} className="px-8">
                {assignMutation.isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                Cập nhật phân quyền
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showRemoveWarning}
        onOpenChange={setShowRemoveWarning}
        title="Xóa lịch sử xử lý"
        description={`Các thành viên sau đang có lịch sử xử lý với tệp này: ${removedUsers.map(u => u.user_name).join(", ")}. Nếu tiếp tục, toàn bộ lịch sử của họ sẽ bị xóa vĩnh viễn.`}
        confirmLabel="Tiếp tục"
        cancelLabel="Quay lại"
        variant="destructive"
        loading={assignMutation.isPending}
        onConfirm={doSubmit}
      />
    </>
  )
}
