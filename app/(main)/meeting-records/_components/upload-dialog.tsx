"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadIcon } from "lucide-react";
import { useUploadTask } from "@/hooks/use-upload-task";
import { type ActionToastVariant } from "@/app/(main)/history/_hooks/useHistoryToast";

const uploadSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề"),
  file: z
    .any()
    .refine((files) => files?.length === 1, "Vui lòng chọn 1 tệp âm thanh")
    .refine((files) => {
      if (!files?.[0]) return false;
      const file = files[0] as File;
      const validExtensions = ["mp3", "wav", "m4a"];
      const extension = file.name.split(".").pop()?.toLowerCase();
      return extension && validExtensions.includes(extension);
    }, "Chỉ hỗ trợ định dạng MP3, WAV, M4A"),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showActionToast: (message: string, variant?: ActionToastVariant) => void;
}

export function UploadFileDialog({ open, onOpenChange, showActionToast }: UploadDialogProps) {
  const { startUpload } = useUploadTask();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
  });

  const onSubmit = (data: UploadFormValues) => {
    const file = data.file[0] as File;
    startUpload({ file, title: data.title });
    onOpenChange(false);
    reset();
    showActionToast("Đang tải lên trong nền. Theo dõi tiến độ ở góc phải bên dưới.", "info");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tải lên bản ghi mới</DialogTitle>
          <DialogDescription>
            Chọn tệp âm thanh và nhập tiêu đề cho bản ghi cuộc họp.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề bản ghi</Label>
            <Input
              id="title"
              placeholder="Nhập tiêu đề cuộc họp..."
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">
                {errors.title.message?.toString()}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Tệp âm thanh</Label>
            <Input
              id="file"
              type="file"
              accept=".mp3,.wav,.m4a"
              {...register("file")}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground italic">
              * Chỉ hỗ trợ tệp định dạng .mp3, .wav, .m4a (tối đa 1GB)
            </p>
            {errors.file && (
              <p className="text-xs text-destructive">
                {errors.file.message?.toString()}
              </p>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit">
              <UploadIcon className="mr-2 size-4" />
              Tải lên
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
