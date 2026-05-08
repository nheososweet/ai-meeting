"use client";

import { useState } from "react";
import { 
  LanguagesIcon, 
  CopyIcon, 
  CheckIcon, 
  LoaderCircleIcon,
  XIcon,
  ArrowRightIcon
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { translateTranscript } from "@/services/pipeline-records.service";
import { cn } from "@/lib/utils";

type TranslateDialogProps = {
  initialText: string;
  trigger?: React.ReactNode;
};

export function TranslateDialog({ initialText, trigger }: TranslateDialogProps) {
  const [open, setOpen] = useState(false);
  const [sourceText, setSourceText] = useState(initialText);
  const [targetLanguage, setTargetLanguage] = useState("Tiếng Anh");
  const [translatedText, setTranslatedText] = useState("");
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => translateTranscript({ text: sourceText, targetLanguage }),
    onSuccess: (data) => {
      setTranslatedText(data);
    },
  });

  function handleCopy() {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpen() {
    setSourceText(initialText);
    setOpen(true);
  }

  return (
    <>
      <div onClick={handleOpen} className="cursor-pointer">
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50">
            <LanguagesIcon className="size-3.5" />
            Dịch Transcript
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="mb-4 flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col justify-between gap-0 rounded-xl p-0 sm:max-w-none"
        >
          <DialogHeader className="space-y-0 text-left shrink-0">
            <DialogTitle className="px-6 pt-6 text-base flex items-center gap-2">
              <LanguagesIcon className="size-4 text-primary" />
              Dịch thuật Transcript
            </DialogTitle>
            <DialogDescription className="px-6 pb-3 text-xs">
              Sử dụng AI để dịch văn bản transcript sang ngôn ngữ đích.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 flex flex-col lg:flex-row overflow-hidden border-t border-border/40">
            {/* Source Section */}
            <div className="flex-1 flex flex-col p-6 gap-4 border-b lg:border-b-0 lg:border-r overflow-hidden">
              <div className="flex items-center justify-between shrink-0">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-blue-500" />
                  Văn bản gốc
                </label>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Ngôn ngữ đích:</span>
                   <input 
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      placeholder="VD: Tiếng Anh, Tiếng Trung..."
                      className="h-8 w-40 px-3 text-xs font-semibold rounded-lg border border-border/60 bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                   />
                </div>
              </div>
              
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="flex-1 w-full p-4 text-sm leading-relaxed rounded-xl border border-border/40 bg-muted/5 resize-none focus:bg-background transition-all outline-none"
                placeholder="Nhập nội dung cần dịch..."
              />
              
              <Button 
                onClick={() => mutation.mutate()} 
                disabled={mutation.isPending || !sourceText}
                className="w-full lg:w-auto h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 gap-2 transition-all active:scale-[0.98]"
              >
                {mutation.isPending ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <ArrowRightIcon className="size-4" />
                )}
                Thực hiện dịch
              </Button>
            </div>

            {/* Result Section */}
            <div className="flex-1 flex flex-col p-6 gap-4 bg-muted/5 overflow-hidden">
              <div className="flex items-center justify-between shrink-0">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Kết quả dịch ({targetLanguage})
                </label>
                
                {translatedText && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopy}
                    className="h-8 gap-1.5 text-[11px] font-bold rounded-lg border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm"
                  >
                    {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                    {copied ? "Đã chép" : "Sao chép"}
                  </Button>
                )}
              </div>

              <div className="flex-1 relative overflow-hidden">
                 {mutation.isPending ? (
                   <div className="h-full w-full rounded-xl border border-dashed border-border/60 bg-background flex flex-col items-center justify-center gap-3">
                      <div className="size-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Đang xử lý...</p>
                   </div>
                 ) : translatedText ? (
                   <div className="h-full w-full p-4 overflow-auto text-sm leading-relaxed rounded-xl border border-border/40 bg-background whitespace-pre-wrap">
                      {translatedText}
                   </div>
                 ) : (
                   <div className="h-full w-full rounded-xl border border-dashed border-border/60 bg-muted/10 flex flex-col items-center justify-center gap-3">
                      <div className="size-12 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground/30">
                        <LanguagesIcon className="size-6" />
                      </div>
                      <p className="text-[11px] font-medium text-muted-foreground/60 italic">Kết quả sẽ được hiển thị tại đây</p>
                   </div>
                 )}
              </div>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none border-t px-6 pb-6 pt-4 sm:justify-end shrink-0">
            <Button variant="outline" onClick={() => setOpen(false)} className="gap-1.5">
               Quay lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
