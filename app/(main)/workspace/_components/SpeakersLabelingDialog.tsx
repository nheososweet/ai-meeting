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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpdateTranscribeMutation } from "@/hooks/services/use-update-transcribe-mutation";
import { useEvaluateTranscriptMutation } from "@/hooks/services/use-evaluate-transcript-mutation";
import type { MeetingRecord } from "@/lib/types/meeting";

type SpeakersLabelingDialogProps = {
  activeMeeting: MeetingRecord;
  onUpdateMeeting: (updated: MeetingRecord) => void;
  setNotice: (message: string) => void;
  showActionToast: (message: string) => void;
};

export function SpeakersLabelingDialog({
  activeMeeting,
  onUpdateMeeting,
  setNotice,
  showActionToast,
}: SpeakersLabelingDialogProps) {
  const [open, setOpen] = useState(false);
  const [speakerMap, setSpeakerMap] = useState<Record<string, string>>({});
  const updateTranscribeMutation = useUpdateTranscribeMutation();
  const evaluateTranscriptMutation = useEvaluateTranscriptMutation();

  const isPending = updateTranscribeMutation.isPending || evaluateTranscriptMutation.isPending;

  // Extract unique speakers from segments
  const uniqueSpeakers = useMemo(() => {
    return Array.from(new Set(activeMeeting.segments.map((s) => s.speaker))).sort(
      (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  }, [activeMeeting.segments]);

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
      if (!activeMeeting.apiRecordId) {
        setNotice("Không tìm thấy ID bản ghi để cập nhật.");
        return;
      }

      const hasChanges = Object.entries(speakerMap).some(
        ([oldName, newName]) => oldName !== newName && newName.trim() !== "",
      );

      if (!hasChanges) {
        setOpen(false);
        return;
      }

      // 1. Prepare new maps (filter out empty strings)
      const cleanMap: Record<string, string> = {};
      Object.entries(speakerMap).forEach(([old, req]) => {
        cleanMap[old] = req.trim() || old;
      });

      // 2. Prepare new segments
      const newSegments = activeMeeting.segments.map((seg) => ({
        ...seg,
        speaker: cleanMap[seg.speaker] || seg.speaker,
      }));

      // 3. Prepare new speakerSummaries
      const newSpeakerSummaries = activeMeeting.speakerSummaries.map((sum) => ({
        ...sum,
        speaker: cleanMap[sum.speaker] || sum.speaker,
      }));

      // 4. Prepare new transcripts (Regex replace)
      // We replacement on each line to ensure we only replace the speaker name column
      const replaceInTranscript = (text: string) => {
        let result = text;
        Object.entries(cleanMap).forEach(([oldName, newName]) => {
          if (oldName === newName) return;
          // Escape regex special chars in oldName
          const escapedOld = oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          
          // Pattern matches from start of line: "SpeakerName (" or "SpeakerName:"
          // We use ^ to ensure it's the beginning of a line (speaker tag)
          const pattern = new RegExp(`^${escapedOld}(?=\\s*[\\(:])`, "gm");
          result = result.replace(pattern, newName);
        });
        return result;
      };

      const newRawTranscript = replaceInTranscript(activeMeeting.rawTranscript);
      const newRefinedTranscript = replaceInTranscript(
        activeMeeting.refinedTranscript || "",
      );

      // 5. Call API to sync with backend
      await updateTranscribeMutation.mutateAsync({
        id: activeMeeting.apiRecordId,
        textContent: newRefinedTranscript,
      });

      // 6. Recalculate score
      const evaluationResult = await evaluateTranscriptMutation.mutateAsync({
        id: activeMeeting.apiRecordId,
        transcript: newRefinedTranscript,
      });

      // 7. Update local state
      onUpdateMeeting({
        ...activeMeeting,
        segments: newSegments,
        speakerSummaries: newSpeakerSummaries,
        rawTranscript: newRawTranscript,
        refinedTranscript: newRefinedTranscript,
        speakerCount: new Set(newSegments.map((s) => s.speaker)).size,
        evaluation: {
          error_details: evaluationResult.errorDetails,
          deductions_per_code: evaluationResult.deductionsPerCode,
          deductions_per_group: evaluationResult.deductionsPerGroup,
          final_score: evaluationResult.finalScore,
          formatted_criteria: evaluationResult.formattedCriteria,
          tags: evaluationResult.tags,
        },
      });

      setNotice("Gán nhãn người tham gia và tính lại điểm thành công.");
      showActionToast("Gán nhãn người tham gia thành công.");
      setOpen(false);
    } catch (error) {
      console.error("Failed to update speakers:", error);
      setNotice("Lỗi khi gán nhãn người tham gia. Vui lòng thử lại.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 border-dashed border-blue-200 bg-blue-50/30 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400"
        >
          <UsersIcon className="size-3.5" />
          <span>Gán nhãn người</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-md"
        showCloseButton={!isPending}
        onPointerDownOutside={(e) => {
          if (isPending) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isPending) {
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
                    htmlFor={`speaker-${speaker}`}
                    className="col-span-1 text-right text-xs font-medium text-muted-foreground truncate"
                    title={speaker}
                  >
                    {speaker}
                  </label>
                  <Input
                    id={`speaker-${speaker}`}
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
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || uniqueSpeakers.length === 0}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? (
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
