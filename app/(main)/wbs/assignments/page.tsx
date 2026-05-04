"use client"

import { useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ClockIcon, HistoryIcon, MoreHorizontalIcon, UserPlusIcon } from "lucide-react"
import { IamSearchBar } from "@/components/iam/shared/iam-search-bar"
import { EmptyState } from "@/components/iam/shared/empty-state"
import { WbsStatusBadge } from "@/components/wbs/shared/wbs-status-badge"
import { WorkflowStepper } from "@/components/wbs/shared/workflow-stepper"
import { AssignDialog } from "@/components/wbs/assignments/assign-dialog"
import { ActivityLogDialog } from "@/components/wbs/assignments/activity-log-dialog"
import { useAuth } from "@/lib/auth/auth-context"
import { WBS_PERMISSIONS } from "@/lib/auth/permissions"
import { mockAssignments, mockProjects } from "@/lib/mock/wbs"
import { mockUsers, mockGroups } from "@/lib/mock/iam"
import type { WbsAssignment, JobStatus } from "@/lib/types/wbs"

export default function AssignmentsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission(WBS_PERMISSIONS.ASSIGNMENTS_MANAGE)

  const [assignments, setAssignments] = useState<WbsAssignment[]>(mockAssignments)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | JobStatus>("all")

  // Dialogs
  const [assignJob, setAssignJob] = useState<WbsAssignment | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [logJob, setLogJob] = useState<WbsAssignment | null>(null)
  const [logOpen, setLogOpen] = useState(false)

  // Filtering
  const filtered = useMemo(() => {
    let result = assignments
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((a) => a.name.toLowerCase().includes(q))
    }
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter)
    }
    return result
  }, [assignments, search, statusFilter])

  // Helpers
  function getProjectName(projectId: string) {
    return mockProjects.find((p) => p.id === projectId)?.name || projectId
  }

  function getAssigneeName(id: string) {
    const user = mockUsers.find((u) => u.id === id)
    if (user) return user.name
    const group = mockGroups.find((g) => g.id === id)
    if (group) return group.name
    return id
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  function isOverdue(deadlineIso: string, status: JobStatus) {
    if (status === "done") return false
    return new Date(deadlineIso) < new Date()
  }

  // Handlers
  function handleStatusChange(assignmentId: string, newStatus: JobStatus) {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id === assignmentId && a.status !== newStatus) {
          return {
            ...a,
            status: newStatus,
            statusHistory: [
              ...a.statusHistory,
              {
                from: a.status,
                to: newStatus,
                changedBy: "current-user", // Mock user
                changedAt: new Date().toISOString(),
              },
            ],
          }
        }
        return a
      })
    )
  }

  function handleSaveAssign(assignmentId: string, assigneeIds: string[]) {
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, assigneeIds } : a))
    )
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      {/* Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 rounded-lg border border-border/80 bg-card px-4 py-3 shadow-sm">
        <IamSearchBar
          placeholder="Tìm công việc..."
          value={search}
          onChange={(v) => setSearch(v)}
        />

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | JobStatus)}>
          <SelectTrigger className="h-9 w-[160px] text-sm bg-white">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chờ xử lý</SelectItem>
            <SelectItem value="in_progress">Đang thực hiện</SelectItem>
            <SelectItem value="review">Đang duyệt</SelectItem>
            <SelectItem value="done">Hoàn thành</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState emptyText="Không tìm thấy công việc nào phù hợp." />
      ) : (
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Tên Công việc</TableHead>
                  <TableHead className="w-[180px]">Dự án / Chiến dịch</TableHead>
                  <TableHead className="w-[180px]">Người thực hiện</TableHead>
                  <TableHead className="w-[160px] text-center">Tiến độ</TableHead>
                  <TableHead className="w-[120px] text-center">Trạng thái</TableHead>
                  <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{job.name}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ClockIcon className="size-3.5" />
                        <span className={isOverdue(job.deadline, job.status) ? "text-destructive font-semibold" : ""}>
                          Hạn chót: {formatDate(job.deadline)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-[160px] block" title={getProjectName(job.projectId)}>
                        {getProjectName(job.projectId)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {job.assigneeIds.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Chưa giao</span>
                        ) : (
                          job.assigneeIds.map((id) => (
                            <Badge key={id} variant="secondary" className="text-[10px] font-normal truncate max-w-[150px]" title={getAssigneeName(id)}>
                              {getAssigneeName(id)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <WorkflowStepper currentStatus={job.status} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <WbsStatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canManage && (
                            <>
                              <DropdownMenuItem onClick={() => { setAssignJob(job); setAssignOpen(true) }}>
                                <UserPlusIcon className="mr-2 size-4 text-muted-foreground" />
                                Phân công
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStatusChange(job.id, "pending")} disabled={job.status === "pending"}>
                                Chuyển: Chờ xử lý
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(job.id, "in_progress")} disabled={job.status === "in_progress"}>
                                Chuyển: Đang thực hiện
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(job.id, "review")} disabled={job.status === "review"}>
                                Chuyển: Đang duyệt
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(job.id, "done")} disabled={job.status === "done"}>
                                Chuyển: Hoàn thành
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => { setLogJob(job); setLogOpen(true) }}>
                            <HistoryIcon className="mr-2 size-4 text-muted-foreground" />
                            Lịch sử trạng thái
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        assignment={assignJob}
        onSave={handleSaveAssign}
      />
      <ActivityLogDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        assignment={logJob}
      />
    </div>
  )
}
