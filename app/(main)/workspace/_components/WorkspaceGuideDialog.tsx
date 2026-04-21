import { HelpCircleIcon, MicIcon, FileAudioIcon, ListTodoIcon, UsersIcon, FileTextIcon, MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function WorkspaceGuideDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Hướng dẫn sử dụng"
        >
          <HelpCircleIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-[95vw] overflow-y-auto lg:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold lg:text-2xl">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HelpCircleIcon className="size-5" />
            </span>
            Hướng dẫn Trợ lý AI
          </DialogTitle>
          <DialogDescription className="text-base text-foreground/80 mt-2">
            Hệ thống hỗ trợ tự động lên Biên bản từ file ghi âm. Xem qua 3 bước tự động cốt lõi:
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 pt-2 pb-4 md:grid-cols-3 md:gap-5 lg:gap-6">
          {/* Step 1 */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:p-5 lg:p-6 lg:gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 lg:size-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
                <span className="text-lg font-bold">1</span>
              </div>
              <h4 className="text-base lg:text-lg font-semibold text-foreground">Đầu vào âm thanh</h4>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground">
              Cung cấp âm thanh hình ảnh cho hệ thống bằng một trong hai cách:
            </p>
            <ul className="mt-2 flex flex-col gap-2 lg:gap-3 space-y-0 text-sm text-muted-foreground">
              <li className="flex items-start gap-2 lg:gap-3 rounded-md bg-muted/40 p-2 lg:p-3">
                <FileAudioIcon className="mt-0.5 size-4 lg:size-5 shrink-0 text-sky-500" />
                <span className="text-sm lg:text-base leading-snug"><strong>Tải tệp lên:</strong> Chọn file ghi âm/video (.mp3, .mp4,...) có sẵn từ máy tính.</span>
              </li>
              <li className="flex items-start gap-2 lg:gap-3 rounded-md bg-muted/40 p-2 lg:p-3">
                <MicIcon className="mt-0.5 size-4 lg:size-5 shrink-0 text-sky-500" />
                <span className="text-sm lg:text-base leading-snug"><strong>Thu âm trực tiếp:</strong> Dùng hệ thống để ghi âm ngay tại phòng họp.</span>
              </li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:p-5 lg:p-6 lg:gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 lg:size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                <span className="text-lg font-bold">2</span>
              </div>
              <h4 className="text-base lg:text-lg font-semibold text-foreground">AI Phân tích (Tự động)</h4>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground">
              Sau khi bấm <strong>Bắt đầu xử lý</strong>, AI sẽ thực hiện đồng thời:
            </p>
            <ul className="mt-2 flex flex-col gap-2 lg:gap-3 space-y-0 text-sm text-muted-foreground">
              <li className="flex items-start gap-2 lg:gap-3 rounded-md bg-muted/40 p-2 lg:p-3">
                <ListTodoIcon className="mt-0.5 size-4 lg:size-5 shrink-0 text-emerald-500" />
                <span className="text-sm lg:text-base leading-snug"><strong>Gỡ băng (Transcript):</strong> Chép lời nói ra văn bản cực kỳ độ chuẩn xác cao.</span>
              </li>
              <li className="flex items-start gap-2 lg:gap-3 rounded-md bg-muted/40 p-2 lg:p-3">
                <UsersIcon className="mt-0.5 size-4 lg:size-5 shrink-0 text-emerald-500" />
                <span className="text-sm lg:text-base leading-snug"><strong>Nhận diện giọng nói:</strong> Tự phân tách lúc nào là Người 1, Người 2 phát biểu.</span>
              </li>
              <li className="flex items-start gap-2 lg:gap-3 rounded-md bg-muted/40 p-2 lg:p-3">
                <FileTextIcon className="mt-0.5 size-4 lg:size-5 shrink-0 text-emerald-500" />
                <span className="text-sm lg:text-base leading-snug"><strong>Tạo Biên bản:</strong> Gom các ý chính & tự viết thành Biên bản chuẩn mẫu.</span>
              </li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:p-5 lg:p-6 lg:gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 lg:size-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                <span className="text-lg font-bold">3</span>
              </div>
              <h4 className="text-base lg:text-lg font-semibold text-foreground">Hoàn thiện & Chia sẻ</h4>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground">
              Đọc lại dữ liệu để tinh chỉnh và phát hành cho mọi người.
            </p>
            <ul className="mt-2 flex flex-col gap-2 lg:gap-3 space-y-0 text-sm text-muted-foreground">
              <li className="flex items-start gap-2 lg:gap-3 rounded-md bg-muted/40 p-2 lg:p-3">
                <FileTextIcon className="mt-0.5 size-4 lg:size-5 shrink-0 text-purple-500" />
                <span className="text-sm lg:text-base leading-snug"><strong>Kiểm tra & Sửa chữa:</strong> Chỉnh sửa tuỳ ý Biên bản và Lưu lại để sử dụng sau.</span>
              </li>
              <li className="flex items-start gap-2 lg:gap-3 rounded-md bg-muted/40 p-2 lg:p-3">
                <MailIcon className="mt-0.5 size-4 lg:size-5 shrink-0 text-purple-500" />
                <span className="text-sm lg:text-base leading-snug"><strong>Gửi Email báo cáo:</strong> Điền danh sách mail nhóm, AI đã soạn email trình bày sẵn.</span>
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
