"use client";

import { useEffect, useMemo, useState } from "react";
import { UsersIcon, SaveIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpdateTranscribeMutation } from "@/hooks/services/use-update-transcribe-mutation";

type HistorySpeakersLabelingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: number;
  rawTranscript: string;
  onSuccess: (newRawTranscript: string) => void;
  showActionToast: (message: string) => void;
};

export function HistorySpeakersLabelingDialog({
  open,
  onOpenChange,
  recordId,
  rawTranscript,
  onSuccess,
  showActionToast,
}: HistorySpeakersLabelingDialogProps) {
  const [speakerMap, setSpeakerMap] = useState<Record<string, string>>({});
  const updateTranscribeMutation = useUpdateTranscribeMutation();

  // Extract unique speakers from raw transcript text
  const uniqueSpeakers = useMemo(() => {
    if (!rawTranscript) return [];
    
    const lines = rawTranscript.split("\n");
    const speakers = new Set<string>();
    
    // Pattern matches "SpeakerName (" at start of line
    const speakerPattern = /^(.+?)\s*\(/;
    
    lines.forEach((line) => {
      const match = line.match(speakerPattern);
      if (match && match[1]) {
        speakers.add(match[1].trim());
      }
    });
    
    return Array.from(speakers).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  }, [rawTranscript]);

  useEffect(() => {
    if (open) {
      const initialMap: Record<string, string> = {};
      uniqueSpeakers.forEach((s) => {
        initialMap[s] = s;
      });
      setSpeakerMap(initialMap);
    }
  }, [open, uniqueSpeakers]);

  const handleSave = async () => {
    try {
      const hasChanges = Object.entries(speakerMap).some(
        ([oldName, newName]) => oldName !== newName && newName.trim() !== "",
      );

      if (!hasChanges) {
        onOpenChange(false);
        return;
      }

      // 1. Prepare new maps (filter out empty strings)
      const cleanMap: Record<string, string> = {};
      Object.entries(speakerMap).forEach(([old, req]) => {
        cleanMap[old] = req.trim() || old;
      });

      // 2. Replace in transcript (Regex replace)
      let newRawTranscript = rawTranscript;
      Object.entries(cleanMap).forEach(([oldName, newName]) => {
        if (oldName === newName) return;
        const escapedOld = oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(`^${escapedOld}(?=\\s*\\()`, "gm");
        newRawTranscript = newRawTranscript.replace(pattern, newName);
      });

      // 3. Call API to sync with backend
      await updateTranscribeMutation.mutateAsync({
        id: recordId,
        textContent: newRawTranscript,
      });

      // 4. Update local state via callback
      onSuccess(newRawTranscript);

      showActionToast("Gán nhãn người tham gia thành công.");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update speakers:", error);
      showActionToast("Lỗi khi gán nhãn người tham gia. Vui lòng thử lại.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        showCloseButton={!updateTranscribeMutation.isPending}
        onPointerDownOutside={(e) => {
          if (updateTranscribeMutation.isPending) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (updateTranscribeMutation.isPending) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Gán nhãn người tham gia</DialogTitle>
          <DialogDescription>
            Thay đổi tên các nhân vật ("Người 0", "Người 1"...) thành tên thật của người tham gia.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[40vh] pr-4">
          <div className="space-y-4 py-4">
            {uniqueSpeakers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Chưa nhận diện được người tham gia nào.
              </p>
            ) : (
              uniqueSpeakers.map((speaker) => (
                <div key={speaker} className="grid grid-cols-4 items-center gap-4">
                  <label
                    htmlFor={`speaker-history-${speaker}`}
                    className="col-span-1 text-right text-xs font-medium text-muted-foreground truncate"
                    title={speaker}
                  >
                    {speaker}
                  </label>
                  <Input
                    id={`speaker-history-${speaker}`}
                    value={speakerMap[speaker] || ""}
                    onChange={(e) =>
                      setSpeakerMap((prev) => ({
                        ...prev,
                        [speaker]: e.target.value,
                      }))
                    }
                    placeholder="Nhập tên mới..."
                    className="col-span-3 h-9"
                  />
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={updateTranscribeMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateTranscribeMutation.isPending || uniqueSpeakers.length === 0}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {updateTranscribeMutation.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
