"use client";

import { useState } from "react";
import { 
    ClipboardCheckIcon, 
    Loader2Icon, 
    AlertCircleIcon, 
    PencilLineIcon 
} from "lucide-react";
import { useCriteriaQuery } from "@/hooks/services/use-criteria-query";
import { useUpdateCriteriaMutation } from "@/hooks/services/use-update-criteria-mutation";
import { CriteriaList } from "@/app/(main)/evaluation-criteria/_components/CriteriaList";
import { CriteriaEditor } from "@/app/(main)/evaluation-criteria/_components/CriteriaEditor";
import { Button } from "@/components/ui/button";
import { useWorkspaceToast } from "@/app/(main)/workspace/_hooks/useWorkspaceToast";
import type { EvaluationCriteriaResponse } from "@/services/pipeline-records.service";

export default function EvaluationCriteriaPage() {
    const { data, isLoading, error, refetch } = useCriteriaQuery();
    const updateCriteriaMutation = useUpdateCriteriaMutation();
    const { showActionToast } = useWorkspaceToast();
    
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const handleSaveCriteria = async (newData: EvaluationCriteriaResponse) => {
        try {
            await updateCriteriaMutation.mutateAsync(newData);
            showActionToast("Cập nhật tiêu chí thành công.");
            setIsEditorOpen(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Lỗi không xác định";
            showActionToast(`Lỗi khi cập nhật: ${message}`, "error");
            throw err;
        }
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <section className="flex min-h-0 flex-col rounded-lg border border-border/80 bg-card p-5 shadow-sm h-[calc(100dvh-6rem)] md:h-[calc(100dvh-8.5rem)]">
                {/* Header - Fixed height */}
                <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b pb-5">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
                            <ClipboardCheckIcon className="size-6 text-primary" />
                            Tiêu chí đánh giá chất lượng
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Danh sách các tiêu chuẩn và quy tắc chấm điểm cho cuộc hội thoại.
                        </p>
                    </div>

                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary"
                        onClick={() => setIsEditorOpen(true)}
                        disabled={isLoading || !!error}
                    >
                        <PencilLineIcon className="size-4" />
                        Chỉnh sửa tiêu chí
                    </Button>
                </div>

                {/* Body - Scrollable area */}
                <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden">
                    {isLoading ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
                            <Loader2Icon className="size-10 animate-spin opacity-20" />
                            <p className="text-sm animate-pulse">Đang tải dữ liệu tiêu chí...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                            <div className="rounded-full bg-rose-50 p-4 dark:bg-rose-950/20">
                                <AlertCircleIcon className="size-10 text-rose-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-foreground">Không thể tải dữ liệu</p>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại sau.
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => refetch()}>
                                Thử lại
                            </Button>
                        </div>
                    ) : data ? (
                        <CriteriaList data={data} />
                    ) : null}
                </div>
            </section>

            <CriteriaEditor 
                open={isEditorOpen}
                onOpenChange={setIsEditorOpen}
                initialData={data ?? null}
                onSave={handleSaveCriteria}
            />
        </div>
    );
}