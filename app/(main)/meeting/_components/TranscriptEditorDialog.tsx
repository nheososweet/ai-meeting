import { useEffect, useState } from "react";
import { Edit3Icon, SaveIcon, XIcon, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { formatTimelineSecond } from "@/app/(main)/workspace/_lib/transcript-utils";

type TranscriptEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawTranscript: string;
  isSaving: boolean;
  onSave: (content: string) => void;
  error: string | null;
};

type EditBlock = {
  id: string;
  isSegment: boolean;
  speaker: string;
  time: string;
  displayTime: string;
  text: string;
  originalLine: string;
};

function speakerToneClass(speaker: string): string {
  const palette = [
    "border-l-sky-500 bg-sky-50/80 dark:border-l-sky-300 dark:bg-sky-950/40",
    "border-l-emerald-500 bg-emerald-50/80 dark:border-l-emerald-300 dark:bg-emerald-950/40",
    "border-l-amber-500 bg-amber-50/80 dark:border-l-amber-300 dark:bg-amber-950/40",
    "border-l-teal-500 bg-teal-50/80 dark:border-l-teal-300 dark:bg-teal-950/40",
  ];
  const hash = speaker
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length] ?? palette[0];
}

function parseRawTranscript(raw: string): EditBlock[] {
  const lines = raw.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  return lines.map((line, idx) => {
    const match = line.match(/^(.+?)\s*\(([^)]+)\):\s*(.*)$/);
    if (match) {
      const timeStr = match[2].trim();
      let displayTime = timeStr;

      const timeMatch = timeStr.match(/([\d.]+)s(?:\s*-\s*([\d.]+)s)?/i);
      if (timeMatch) {
        const start = formatTimelineSecond(Number.parseFloat(timeMatch[1]));
        if (timeMatch[2]) {
          const end = formatTimelineSecond(Number.parseFloat(timeMatch[2]));
          displayTime = `${start} - ${end}`;
        } else {
          displayTime = start;
        }
      }

      return {
        id: `block-${idx}`,
        isSegment: true,
        speaker: match[1].trim(),
        time: timeStr,
        displayTime: displayTime,
        text: match[3].trim(),
        originalLine: line,
      };
    }
    return {
      id: `block-${idx}`,
      isSegment: false,
      speaker: "",
      time: "",
      displayTime: "",
      text: line,
      originalLine: line,
    };
  });
}

export function TranscriptEditorDialog({
  open,
  onOpenChange,
  rawTranscript,
  isSaving,
  onSave,
  error,
}: TranscriptEditorDialogProps) {
  const [blocks, setBlocks] = useState<EditBlock[]>([]);

  useEffect(() => {
    if (open) {
      setBlocks(parseRawTranscript(rawTranscript));
    }
  }, [open, rawTranscript]);

  const handleUpdateBlock = (idx: number, updates: Partial<EditBlock>) => {
    setBlocks(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
  };

  const currentContent = blocks
    .map(b => (b.isSegment ? `${b.speaker} (${b.time}): ${b.text}` : b.text))
    .join("\n");
  const isChanged = currentContent !== rawTranscript;

  return (
    <Dialog open={open} onOpenChange={(val) => !isSaving && onOpenChange(val)}>
      <DialogContent
        showCloseButton={false}
        className="mb-4 flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col justify-between gap-0 rounded-xl p-0 sm:max-w-none overflow-hidden"
      >
        <DialogHeader className="space-y-0 text-left px-6 py-4 border-b shrink-0 bg-white z-10">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Edit3Icon className="size-5 text-primary" />
            Chỉnh sửa bản gỡ băng
          </DialogTitle>
          <DialogDescription className="text-xs">
            Nội dung đã được phân tách tự động theo người nói. Thời gian đã được tự động giữ nguyên để đảm bảo đồng bộ với Audio.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <div className="p-6 bg-white">
            {error && (
              <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <div className="rounded-md border border-border/60 p-4 space-y-4">
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className={cn(
                    "group relative flex flex-col gap-2 rounded-xl border-l-4 p-4 transition-all bg-background shadow-sm hover:shadow-md",
                    block.isSegment ? speakerToneClass(block.speaker) : "border-l-muted-foreground bg-muted/10"
                  )}
                >
                  {block.isSegment ? (
                    <div className="flex items-center justify-between mb-1 gap-4">
                      <input
                        value={block.speaker}
                        onChange={(e) => handleUpdateBlock(idx, { speaker: e.target.value })}
                        className="text-sm font-bold text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 -ml-1 transition-colors w-1/3"
                        placeholder="Tên người nói"
                      />
                      <span className="rounded-full bg-muted/60 px-2.5 py-0.5 font-mono text-xs text-muted-foreground border border-border/50 shrink-0">
                        {block.displayTime}
                      </span>
                    </div>
                  ) : null}
                  <textarea
                    value={block.text}
                    onChange={(e) => handleUpdateBlock(idx, { text: e.target.value })}
                    disabled={isSaving}
                    rows={Math.max(2, Math.min(10, block.text.split("\n").length + Math.floor(block.text.length / 80)))}
                    className="w-full resize-y rounded-md bg-transparent text-sm leading-relaxed text-foreground/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 p-1 -mx-1"
                    placeholder="Nhập nội dung..."
                    spellCheck={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mx-0 mb-0 rounded-none border-t px-6 py-4 sm:justify-end gap-2 shrink-0 z-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            <XIcon className="mr-2 size-4" /> Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={() => onSave(currentContent)}
            disabled={isSaving || !isChanged}
          >
            {isSaving ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 size-4" /> Lưu thay đổi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
