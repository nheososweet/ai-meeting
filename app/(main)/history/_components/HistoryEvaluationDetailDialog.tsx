"use client";

import React, { useMemo } from "react";
import { ChevronLeftIcon, ShieldAlertIcon, TagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatTimelineSecond, parseTranscriptSegments } from "@/app/(main)/workspace/_lib/transcript-utils";
import type { EvaluationResult } from "@/lib/types/meeting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface HistoryEvaluationDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transcriptContent: string;
  evaluation?: EvaluationResult;
  filename?: string;
}

function parseTimeRange(range: string) {
  const match = range.match(/([\d.]+)s\s*-\s*([\d.]+)s/);
  if (!match) return null;
  return {
    start: parseFloat(match[1]),
    end: parseFloat(match[2]),
  };
}

export function HistoryEvaluationDetailDialog({
  isOpen,
  onOpenChange,
  transcriptContent,
  evaluation,
  filename,
}: HistoryEvaluationDetailDialogProps) {
  const segments = useMemo(() => {
    const lines = transcriptContent.split("\n").filter(line => line.trim().length > 0);
    return parseTranscriptSegments(lines);
  }, [transcriptContent]);

  const criteriaData = useMemo(() => {
    return evaluation?.formatted_criteria || null;
  }, [evaluation?.formatted_criteria]);

  const criteriaMap = useMemo(() => {
    const map: Record<string, { description: string; deduction: number }> = {};
    if (!criteriaData) return map;

    criteriaData.sections.forEach((section) => {
      section.criteria.forEach((c) => {
        map[c.id] = { description: c.description, deduction: c.deduction };
      });
    });
    return map;
  }, [criteriaData]);

  const segmentErrors = useMemo(() => {
    if (!evaluation) return {};

    const errorsBySegment: Record<string, string[]> = {};

    segments.forEach((seg) => {
      const segId = seg.id;
      const segStart = seg.startSecond;
      const segEnd = seg.endSecond;

      Object.entries(evaluation.error_details).forEach(([criteriaId, ranges]) => {
        ranges.forEach((rangeStr) => {
          const range = parseTimeRange(rangeStr);
          if (range && segStart < range.end && segEnd > range.start) {
            if (!errorsBySegment[segId]) {
              errorsBySegment[segId] = [];
            }
            if (!errorsBySegment[segId].includes(criteriaId)) {
              errorsBySegment[segId].push(criteriaId);
            }
          }
        });
      });
    });

    return errorsBySegment;
  }, [segments, evaluation]);

  const globalErrors = useMemo(() => {
    if (!evaluation) return [];
    
    return Object.entries(evaluation.deductions_per_code)
      .filter(([id, deduction]) => deduction > 0 && (!evaluation.error_details[id] || evaluation.error_details[id].length === 0))
      .map(([id]) => id);
  }, [evaluation]);

  const totalDeduction = useMemo(() => {
    if (!evaluation) return 0;
    return Object.values(evaluation.deductions_per_group).reduce((acc, d) => acc + d, 0);
  }, [evaluation]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="mb-4 flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col justify-between gap-0 overflow-hidden rounded-xl p-0 sm:max-w-none"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <DialogHeader className="space-y-0 border-b bg-muted/20 px-6 py-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">
                  Báo cáo đánh giá chất lượng hội thoại
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs">
                  {filename || "Bản ghi lịch sử"} • Phân tích chi tiết dựa trên bộ tiêu chí nghiệp vụ.
                </DialogDescription>
              </div>
              {evaluation && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tổng điểm trừ</p>
                    <p className="text-sm font-semibold text-red-500">-{totalDeduction.toFixed(1)}</p>
                  </div>
                  <div className="h-10 w-px bg-border/60" />
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Điểm cuối cùng</p>
                    <p className={`text-2xl font-black ${evaluation.final_score >= 8 ? 'text-emerald-600' : evaluation.final_score >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                      {evaluation.final_score.toFixed(1)}/{criteriaData?.total_max_score || 10}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </DialogHeader>

          <Tabs defaultValue="transcript" className="flex min-h-0 flex-1 flex-col">
            <div className="border-b bg-background px-6">
              <TabsList className="h-12 w-full justify-start gap-6 bg-transparent p-0">
                <TabsTrigger 
                  value="transcript" 
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                >
                  Transcript & Lỗi chi tiết
                </TabsTrigger>
                <TabsTrigger 
                  value="rubric" 
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                >
                  Bộ tiêu chí & Thang điểm
                </TabsTrigger>
                {evaluation?.tags && evaluation.tags.length > 0 && (
                  <TabsTrigger 
                    value="tags" 
                    className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
                  >
                    Tags nhận diện
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="transcript" className="m-0 min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {/* Global Errors Alert */}
                  {globalErrors.length > 0 && (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-amber-100 p-1 dark:bg-amber-900/40">
                          <ShieldAlertIcon className="size-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Lỗi tổng quát (Toàn cuộc gọi)</h4>
                          <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                            Các lỗi sau đây được ghi nhận cho toàn bộ phiên hội thoại mà không định vị được dòng cụ thể:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {globalErrors.map(errId => (
                              <Badge key={errId} variant="outline" className="border-amber-200 bg-amber-100/50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-400">
                                {errId}: {criteriaMap[errId]?.description} (-{criteriaMap[errId]?.deduction})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <TooltipProvider>
                      {segments.map((seg) => {
                        const errors = segmentErrors[seg.id] || [];
                        const isError = errors.length > 0;

                        return (
                          <div
                            key={seg.id}
                            className={`group relative flex flex-col gap-1 rounded-xl border p-4 transition-all duration-200 ${isError
                                ? "border-red-200 bg-red-50/40 shadow-sm dark:border-red-900/30 dark:bg-red-900/10"
                                : "border-border/40 bg-background hover:border-border/80"
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${isError ? 'text-red-700 dark:text-red-400' : 'text-foreground'}`}>
                                  {seg.speaker}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground/70">
                                  {formatTimelineSecond(seg.startSecond)} - {formatTimelineSecond(seg.endSecond)}
                                </span>
                              </div>
                              {isError && (
                                <div className="flex gap-1.5">
                                  {errors.map((errId) => (
                                    <Tooltip key={errId}>
                                      <TooltipTrigger asChild>
                                        <div className="flex cursor-help items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-700 dark:bg-red-900/60 dark:text-red-300">
                                          <ShieldAlertIcon className="size-3" />
                                          Lỗi {errId}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[300px] p-3 shadow-xl">
                                        <div className="space-y-1.5">
                                          <div className="flex items-center justify-between gap-4">
                                            <p className="font-bold text-red-600 dark:text-red-400">Tiêu chí {errId}</p>
                                            <p className="text-[10px] font-black tracking-tighter text-red-500">- {criteriaMap[errId]?.deduction}đ</p>
                                          </div>
                                          <p className="text-xs leading-relaxed">{criteriaMap[errId]?.description || "Không xác định"}</p>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className={`text-sm leading-relaxed ${isError ? 'text-red-900/90 dark:text-red-100/90' : 'text-foreground/80'}`}>
                              {seg.text}
                            </p>
                          </div>
                        );
                      })}
                    </TooltipProvider>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="rubric" className="m-0 min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {!criteriaData ? (
                    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                      Không tìm thấy bộ tiêu chí đi kèm bản ghi này.
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-1">
                      {criteriaData.sections.map((section) => (
                        <div key={section.id} className="rounded-xl border border-border/60 bg-muted/5 p-5">
                          <div className="mb-4 flex items-center justify-between border-b pb-3">
                            <h4 className="font-bold text-foreground">
                              {section.id}. {section.name}
                            </h4>
                            <Badge variant="secondary" className="font-bold">Tối đa: {section.max_score}đ</Badge>
                          </div>
                          <div className="grid gap-3">
                            {section.criteria.map((c) => {
                              const isViolated = evaluation?.deductions_per_code[c.id] && evaluation.deductions_per_code[c.id] > 0;
                              return (
                                <div 
                                  key={c.id} 
                                  className={`flex items-start justify-between gap-4 rounded-lg border p-3 text-sm transition-colors ${
                                    isViolated 
                                      ? "border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/20" 
                                      : "border-border/40 bg-background/50"
                                  }`}
                                >
                                  <div className="flex gap-3">
                                    <span className="font-mono font-bold text-muted-foreground">{c.id}</span>
                                    <p className={isViolated ? "font-medium text-red-900 dark:text-red-100" : "text-muted-foreground"}>
                                      {c.description}
                                    </p>
                                  </div>
                                  <div className="text-right whitespace-nowrap">
                                    <span className={`text-xs font-bold ${isViolated ? 'text-red-600' : 'text-muted-foreground/60'}`}>
                                      -{c.deduction}đ
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tags" className="m-0 min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-8 max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <TagIcon className="size-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold">Tags nhận diện</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {evaluation?.tags?.map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="px-4 py-2 text-sm bg-muted/50 border border-border/50 hover:bg-muted transition-colors rounded-lg font-medium"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-t bg-muted/10 px-6 py-4 sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline" className="gap-2">
              <ChevronLeftIcon className="size-4" />
              Đóng báo cáo
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
