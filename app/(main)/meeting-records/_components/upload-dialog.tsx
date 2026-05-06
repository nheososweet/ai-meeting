"use client";

import { useState } from "react";
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
import { Loader2Icon, UploadIcon } from "lucide-react";
import { useUploadFileMutation } from "@/hooks/services/use-files";
import { type ActionToastVariant } from "@/app/(main)/history/_hooks/useHistoryToast";

const uploadSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề"),
  file: z.any().refine((files) => files?.length === 1, "Vui lòng chọn 1 tệp audio"),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showActionToast: (message: string, variant?: ActionToastVariant) => void;
}

export function UploadFileDialog({ open, onOpenChange, showActionToast }: UploadDialogProps) {
  const uploadMutation = useUploadFileMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
  });

  const onSubmit = async (data: UploadFormValues) => {
    const file = data.file[0] as File;
    try {
      await uploadMutation.mutateAsync({ file, title: data.title });
      showActionToast("Tải lên bản ghi thành công", "success");
      onOpenChange(false);
      reset();
    } catch (error) {
      showActionToast("Tải lên thất bại. Vui lòng thử lại.", "error");
    }
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
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Tệp âm thanh</Label>
            <Input
              id="file"
              type="file"
              accept="audio/*"
              {...register("file")}
              className="cursor-pointer"
            />
            {errors.file && (
              <p className="text-xs text-destructive">{errors.file.message}</p>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploadMutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 size-4" />
                  Tải lên
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
