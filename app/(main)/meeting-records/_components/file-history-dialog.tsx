"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ActivityIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  UserIcon,
  UploadCloudIcon,
  FileCheckIcon,
  FileTextIcon,
  MailIcon,
  DownloadIcon,
} from "lucide-react"
import { useFileHistory } from "@/hooks/services/use-file-history"
import { type FileHistoryItem } from "@/lib/types/files"
import { formatDate } from "@/lib/utils"

interface FileHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: number | null
  filename?: string
  canSendMail?: boolean
  onPreviewReport?: (url: string, filename: string) => void
  onPreviewTranscript?: (transcribeUrl: string, userId: number) => void
  onSendEmail?: () => void
}

const HISTORY_STEPS = [
  { key: "transcribe", label: "Bản gỡ băng" },
  { key: "summary", label: "Tóm tắt" },
  { key: "report", label: "Biên bản" },
  { key: "send_email", label: "Email" },
] as const

function StepStatusIcon({ status, label }: { status: string; label: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center">
            {status === "success" ? (
              <CheckCircle2Icon className="size-3.5 text-emerald-500" />
            ) : status === "processing" ? (
              <Loader2Icon className="size-3.5 text-blue-500 animate-spin" />
            ) : (
              <ClockIcon className="size-3.5 text-slate-300" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span className="text-xs font-medium">
            {label}: {status === "success" ? "Hoàn thành" : status === "processing" ? "Đang xử lý" : status === "failed" ? "Lỗi" : "Chờ xử lý"}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface UserHistoryCardProps {
  item: FileHistoryItem
  canSendMail?: boolean
  onPreviewReport?: (url: string, filename: string) => void
  onPreviewTranscript?: (transcribeUrl: string, userId: number) => void
  onSendEmail?: () => void
}

function UserHistoryCard({
  item,
  canSendMail,
  onPreviewReport,
  onPreviewTranscript,
  onSendEmail,
}: UserHistoryCardProps) {
  const isUploader = item.user_type === "uploader"

  const hasReport = !!item.report && !!onPreviewReport
  const hasTranscript = !!item.transcribe_url && !!onPreviewTranscript
  const hasEmail = !!canSendMail && !!onSendEmail
  const hasDownload = !!item.transcribe_url
  const hasAnyAction = hasReport || hasTranscript || hasEmail || hasDownload

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-md shrink-0 ${isUploader ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"}`}>
            {isUploader ? <UploadCloudIcon className="size-3.5" /> : <UserIcon className="size-3.5" />}
          </div>
          <span className="text-sm font-medium truncate">{item.user_name}</span>
        </div>
        <Badge
          variant="secondary"
          className={`shrink-0 text-xs ${isUploader ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
        >
          {isUploader ? "Người tải lên" : "Người được giao"}
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        {HISTORY_STEPS.map((step) => (
          <div key={step.key} className="flex flex-col items-center gap-1">
            <StepStatusIcon status={item.step_status[step.key]} label={step.label} />
            <span className="text-[11px] text-muted-foreground/70 leading-none">{step.label}</span>
          </div>
        ))}
      </div>

      {item.processed_at && (
        <p className="text-xs text-muted-foreground">
          Hoàn thành lúc: <span className="font-medium text-foreground">{formatDate(item.processed_at)}</span>
        </p>
      )}

      {hasAnyAction && (
        <div className="flex items-center gap-1 pt-1 border-t border-border/40">
          <TooltipProvider>
            {hasReport && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => onPreviewReport!(item.report!, item.report!)}
                  >
                    <FileCheckIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Xem Biên bản</TooltipContent>
              </Tooltip>
            )}

            {hasTranscript && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => onPreviewTranscript!(item.transcribe_url!, item.user_id)}
                  >
                    <FileTextIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Xem bản gỡ băng</TooltipContent>
              </Tooltip>
            )}

            {hasEmail && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => onSendEmail!()}
                  >
                    <MailIcon className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Gửi Email</TooltipContent>
              </Tooltip>
            )}

            {item.transcribe_url && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    asChild
                  >
                    <a href={item.transcribe_url} download>
                      <DownloadIcon className="size-3.5" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tải bản gỡ băng</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}

export function FileHistoryDialog({
  open,
  onOpenChange,
  fileId,
  filename,
  canSendMail,
  onPreviewReport,
  onPreviewTranscript,
  onSendEmail,
}: FileHistoryDialogProps) {
  const { data, isLoading } = useFileHistory(open ? fileId : null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <ActivityIcon className="size-5 text-primary" />
            Tiến độ xử lý
          </DialogTitle>
          <DialogDescription className="line-clamp-1">
            Trạng thái xử lý của từng thành viên cho tệp{" "}
            <span className="font-semibold text-foreground italic">{filename}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm">Đang tải dữ liệu...</span>
            </div>
          ) : !data?.data?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ActivityIcon className="size-10 mb-3 opacity-30" />
              <p className="text-sm">Chưa có dữ liệu tiến độ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.data.map((item) => (
                <UserHistoryCard
                  key={item.user_id}
                  item={item}
                  canSendMail={canSendMail}
                  onPreviewReport={onPreviewReport}
                  onPreviewTranscript={onPreviewTranscript}
                  onSendEmail={onSendEmail}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 p-6 pt-2 border-t bg-muted/5">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
