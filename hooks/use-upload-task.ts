"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { filesService } from "@/services/files.service";
import { useBackgroundTask } from "@/hooks/use-background-task";
import type { BackgroundTaskItem } from "@/lib/types/background-tasks";

export function useUploadTask() {
  const { addTask, updateTask, scheduleAutoDismiss } = useBackgroundTask();
  const queryClient = useQueryClient();

  const startUpload = useCallback(({ file, title }: { file: File; title: string }) => {
    const taskId = crypto.randomUUID();

    const newTask: BackgroundTaskItem = {
      id: taskId,
      type: "upload_file",
      label: `Tải lên: ${title || file.name}`,
      status: "running",
      progress: 0,
      createdAt: Date.now(),
    };
    addTask(newTask);

    void (async () => {
      try {
        await filesService.uploadFile(file, title);
        updateTask(taskId, {
          status: "completed",
          progress: 100,
          completedAt: Date.now(),
        });
        queryClient.invalidateQueries({ queryKey: ["files"] });
        queryClient.invalidateQueries({ queryKey: ["my-uploads"] });
        scheduleAutoDismiss(taskId, 8_000);
      } catch (err) {
        updateTask(taskId, {
          status: "failed",
          errorMessage: err instanceof Error ? err.message : "Lỗi không xác định",
        });
        scheduleAutoDismiss(taskId, 12_000);
      }
    })();
  }, [addTask, updateTask, scheduleAutoDismiss, queryClient]);

  return { startUpload };
}
