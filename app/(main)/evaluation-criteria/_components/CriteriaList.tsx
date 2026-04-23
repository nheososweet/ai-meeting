import { 
  AlertCircleIcon, 
  ChevronRightIcon, 
  MinusCircleIcon, 
  PlusCircleIcon, 
  TargetIcon 
} from "lucide-react";
import type { EvaluationCriteriaResponse, EvaluationCriteriaSection } from "@/services/pipeline-records.service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type CriteriaListProps = {
  data: EvaluationCriteriaResponse;
};

export function CriteriaList({ data }: CriteriaListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-8 py-2">
          {data.sections.map((section) => (
            <CriteriaSection key={section.id} section={section} />
          ))}
        </div>
      </div>
      
      {/* Total Footer - Fixed at bottom */}
      <div className="mt-4 border-t border-border bg-card/50 pt-4 backdrop-blur-xs">
        <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
          <div className="flex items-center gap-2">
            <TargetIcon className="size-5 text-primary" />
            <span className="font-semibold text-foreground">Tổng điểm tối đa toàn bộ tiêu chí</span>
          </div>
          <Badge variant="secondary" className="px-3 py-1 text-base font-bold text-primary">
            {data.total_max_score} điểm
          </Badge>
        </div>
      </div>
    </div>
  );
}

function CriteriaSection({ section }: { section: EvaluationCriteriaSection }) {
  return (
    <div className="group space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
            {section.id}
          </div>
          <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
            {section.name}
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span>Tối đa:</span>
          <span className="font-bold text-foreground">{section.max_score}đ</span>
        </div>
      </div>

      <div className="grid gap-3">
        {section.criteria.map((item) => (
          <div 
            key={item.id} 
            className="relative flex items-start gap-4 rounded-xl border border-border/40 bg-muted/20 p-4 transition-all hover:border-primary/30 hover:bg-muted/40 hover:shadow-sm"
          >
            <div className="mt-1 flex shrink-0 items-center justify-center">
              <MinusCircleIcon className="size-4 text-rose-500 opacity-70" />
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  Mã: {item.id}
                </span>
                <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                  -{item.deduction}đ
                </span>
              </div>
              <p className="text-sm leading-6 text-foreground/90">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
