import React, { useState, useEffect } from "react";
import {
  PlusCircleIcon,
  Trash2Icon,
  SaveIcon,
  XIcon,
  AlertTriangleIcon,
  LoaderCircleIcon,
  LayoutGridIcon,
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  EvaluationCriteriaResponse,
  EvaluationCriteriaSection,
  EvaluationCriteriaItem,
} from "@/services/pipeline-records.service";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CriteriaEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: EvaluationCriteriaResponse | null;
  onSave: (data: EvaluationCriteriaResponse) => Promise<void>;
};

export function CriteriaEditor({
  open,
  onOpenChange,
  initialData,
  onSave,
}: CriteriaEditorProps) {
  const [data, setData] = useState<EvaluationCriteriaResponse>({
    sections: [],
    total_max_score: 10,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData && open) {
      setData(JSON.parse(JSON.stringify(initialData)));
    }
  }, [initialData, open]);

  const handleAddSection = () => {
    setData((prev) => {
      const nextId = (prev.sections.length + 1).toString();
      const newSection: EvaluationCriteriaSection = {
        id: nextId,
        name: `Nhóm tiêu chí mới ${nextId}`,
        max_score: 1.5,
        criteria: [
          {
            id: `${nextId}.1`,
            description: "",
            deduction: 0.5,
          },
        ],
      };
      return {
        ...prev,
        sections: [...prev.sections, newSection],
      };
    });
  };

  const handleRemoveSection = (sectionIndex: number) => {
    setData((prev) => {
      const newSections = prev.sections.filter((_, i) => i !== sectionIndex);
      return { ...prev, sections: newSections };
    });
  };

  const handleSectionChange = (
    index: number,
    field: keyof EvaluationCriteriaSection,
    value: any,
  ) => {
    setData((prev) => {
      const newSections = [...prev.sections];
      newSections[index] = { ...newSections[index], [field]: value };
      return { ...prev, sections: newSections };
    });
  };

  const handleAddCriteria = (sectionIndex: number) => {
    setData((prev) => {
      const newSections = [...prev.sections];
      const section = { ...newSections[sectionIndex] };
      section.criteria = [...section.criteria];

      const nextId = `${section.id}.${section.criteria.length + 1}`;
      section.criteria.push({
        id: nextId,
        description: "",
        deduction: 0.5,
      });

      newSections[sectionIndex] = section;
      return { ...prev, sections: newSections };
    });
  };

  const handleRemoveCriteria = (sectionIndex: number, criteriaIndex: number) => {
    setData((prev) => {
      const newSections = [...prev.sections];
      const section = { ...newSections[sectionIndex] };
      section.criteria = [...section.criteria];

      if (section.criteria.length <= 1) {
        setError("Mỗi nhóm phải có ít nhất một tiêu chí con.");
        return prev;
      }

      section.criteria.splice(criteriaIndex, 1);
      newSections[sectionIndex] = section;
      setError(null);
      return { ...prev, sections: newSections };
    });
  };

  const handleCriteriaChange = (
    sectionIndex: number,
    criteriaIndex: number,
    field: keyof EvaluationCriteriaItem,
    value: any,
  ) => {
    setData((prev) => {
      const newSections = [...prev.sections];
      const section = { ...newSections[sectionIndex] };
      section.criteria = [...section.criteria];

      section.criteria[criteriaIndex] = {
        ...section.criteria[criteriaIndex],
        [field]: value,
      };

      newSections[sectionIndex] = section;
      return { ...prev, sections: newSections };
    });
  };

  const handleSave = async () => {
    // Basic validation
    for (const section of data.sections) {
      if (!section.name.trim()) {
        setError("Tên nhóm tiêu chí không được để trống.");
        return;
      }
      if (section.criteria.length === 0) {
        setError(`Nhóm "${section.name}" phải có ít nhất 1 tiêu chí con.`);
        return;
      }
      for (const item of section.criteria) {
        if (!item.description.trim()) {
          setError(`Mô tả tiêu chí trong nhóm "${section.name}" không được để trống.`);
          return;
        }
      }
    }

    // Score validation logic
    const totalSectionsScore = data.sections.reduce((sum, s) => sum + s.max_score, 0);
    if (totalSectionsScore > data.total_max_score) {
      setError(
        `Tổng điểm các nhóm (${totalSectionsScore}) không được vượt quá tổng điểm tối đa hệ thống (${data.total_max_score}).`,
      );
      return;
    }

    for (const section of data.sections) {
      for (const item of section.criteria) {
        if (item.deduction > section.max_score) {
          setError(
            `Điểm trừ "${item.description}" (${item.deduction}đ) không được vượt quá điểm tối đa của nhóm "${section.name}" (${section.max_score}đ).`,
          );
          return;
        }
      }
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(data);
      onOpenChange(false);
    } catch (e) {
      setError("Có lỗi xảy ra khi lưu. Vui lòng kiểm tra lại.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="mb-4 flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col justify-between gap-0 overflow-hidden rounded-xl p-0 sm:max-w-none"
      >
        {/* Header - Styled like TranscriptComparisonDialog */}
        <DialogHeader className="space-y-0 text-left shrink-0">
          <div className="flex items-start justify-between px-6 pt-6">
            <div className="space-y-1">
              <DialogTitle className="text-base font-semibold">
                Thiết lập Tiêu chí Đánh giá
              </DialogTitle>
              <DialogDescription className="text-xs">
                Quản lý cấu trúc thang điểm và tiêu chí chấm điểm tự động cho AI.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4 max-w-5xl mx-auto space-y-6">
            {/* System Config Card */}
            <div className="bg-muted/10 p-5 rounded-lg border border-border/60">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground uppercase tracking-wide">Tổng điểm tối đa toàn hệ thống</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    type="number"
                    min={0}
                    value={data.total_max_score}
                    onChange={(e) => setData({ ...data, total_max_score: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-24 h-9 font-semibold text-sm bg-background"
                  />
                  <span className="text-xs text-muted-foreground font-medium">điểm (Basic score)</span>
                </div>
              </div>
            </div>

            {/* Sections List */}
            <div className="space-y-6">
              {data.sections.map((section, sIdx) => (
                <div
                  key={sIdx}
                  className="rounded-lg border border-border bg-background shadow-sm overflow-hidden"
                >
                  {/* Section Header */}
                  <div className="bg-muted/20 px-5 py-3 flex flex-wrap items-center gap-4 border-b border-border">
                    <div className="flex size-7 items-center justify-center rounded bg-foreground/10 text-foreground text-[10px] font-bold shrink-0">
                      {sIdx + 1}
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <Input
                        value={section.name}
                        onChange={(e) => handleSectionChange(sIdx, "name", e.target.value)}
                        placeholder="Nhập tên nhóm tiêu chí..."
                        className="h-8 text-sm font-semibold border-none bg-transparent focus-visible:ring-0 shadow-none placeholder:opacity-40"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">Trọng số:</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.5"
                          value={section.max_score}
                          onChange={(e) => handleSectionChange(sIdx, "max_score", Math.max(0, parseFloat(e.target.value) || 0))}
                          className="h-8 w-16 text-center text-xs font-bold bg-background"
                        />
                        <span className="text-[10px] font-semibold text-muted-foreground">đ</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSection(sIdx)}
                        className="size-8 text-muted-foreground hover:text-rose-600 transition-colors"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Criteria Items */}
                  <div className="p-5 space-y-4">
                    <div className="space-y-3">
                      {section.criteria.map((item, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 rounded-md border border-border/50 bg-muted/5 transition-colors group/item"
                        >
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-4">
                            <div className="sm:col-span-2 space-y-1">
                              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Mã lỗi</Label>
                              <Input
                                value={item.id}
                                onChange={(e) => handleCriteriaChange(sIdx, cIdx, "id", e.target.value)}
                                className="h-8 font-mono text-[10px] font-semibold bg-background"
                              />
                            </div>
                            <div className="sm:col-span-8 space-y-1">
                              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Mô tả vi phạm chi tiết</Label>
                              <Input
                                value={item.description}
                                onChange={(e) => handleCriteriaChange(sIdx, cIdx, "description", e.target.value)}
                                placeholder="Ví dụ: Sử dụng từ ngữ không chuyên nghiệp..."
                                className="h-8 text-xs bg-background placeholder:opacity-30"
                              />
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center block">Trừ điểm</Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.5"
                                  value={item.deduction}
                                  onChange={(e) => handleCriteriaChange(sIdx, cIdx, "deduction", Math.max(0, parseFloat(e.target.value) || 0))}
                                  className="h-8 pr-7 text-center text-xs font-bold text-rose-600 bg-background"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-400">đ</span>
                              </div>
                            </div>
                          </div>

                          <div className="lg:pt-4 flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCriteria(sIdx, cIdx)}
                              className="size-8 text-muted-foreground/30 hover:text-rose-600 lg:opacity-0 group-hover/item:opacity-100 transition-all"
                            >
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCriteria(sIdx)}
                      className="w-full h-9 gap-1.5 text-xs font-medium border-dashed border-border text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg"
                    >
                      <PlusCircleIcon className="size-3.5" />
                      Thêm tiêu chí vi phạm
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={handleAddSection}
                className="w-full py-6 border-dashed border-2 gap-2.5 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 rounded-xl transition-all"
              >
                <PlusCircleIcon className="size-5" />
                <span className="text-sm font-semibold">Thêm Nhóm tiêu chí lớn</span>
              </Button>
            </div>
          </div>
        </ScrollArea>

        {/* Footer - Styled like TranscriptComparisonDialog */}
        <DialogFooter className="mx-0 mb-0 rounded-none border-t px-6 pb-6 pt-4 sm:justify-end shrink-0">
          {error && (
            <div className="mr-auto flex items-center gap-2 text-rose-600 text-xs font-medium animate-in slide-in-from-left-1">
              <AlertTriangleIcon className="size-3.5" />
              {error}
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="gap-1.5"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            Lưu cấu hình & Cập nhật
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
