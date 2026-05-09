import { 
  ClipboardListIcon, 
  ClockIcon, 
  CheckCircle2Icon, 
  PlayIcon,
  MicIcon,
  Loader2Icon,
  CalendarIcon,
  Building2Icon
} from "lucide-react";
import Link from "next/link";
import { StatsCard } from "./stats-card";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "../_hooks/use-dashboard-stats";

export function UserView() {
  const { stats, recentActivity, loading } = useDashboardStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top row stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Tổng việc được gán"
          value={stats.totalFiles.toLocaleString()}
          description="Tất cả hồ sơ bạn tham gia"
          icon={ClipboardListIcon}
          isLoading={loading.total}
        />
        <StatsCard
          title="Chờ xử lý"
          value={stats.waitingFiles.toLocaleString()}
          description="Hồ sơ đang đợi (waiting)"
          icon={ClockIcon}
          className="border-amber-100/50"
          isLoading={loading.waiting}
        />
        <StatsCard
          title="Đã hoàn thành"
          value={stats.completedFiles.toLocaleString()}
          description="Hồ sơ đã thành công (success)"
          icon={CheckCircle2Icon}
          className="border-emerald-100/50"
          isLoading={loading.completed}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Priority Task Queue - 8 columns */}
        <div className="md:col-span-8 rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border/40">
            <div>
              <h3 className="font-bold text-lg text-foreground">Hộp việc cá nhân</h3>
              <p className="text-sm text-muted-foreground">Các bản ghi mới nhất của bạn</p>
            </div>
            <Link href="/meeting-records">
              <Button variant="outline" size="sm" className="h-8 text-xs px-4">
                Xem tất cả
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {loading.activity ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="size-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))
            ) : (
              recentActivity.map((record) => (
                <div key={record.id} className="group flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    record.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                    record.status === "failed" ? "bg-rose-50 text-rose-600" : "bg-primary/5 text-primary"
                  )}>
                    <MicIcon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                      {record.title || record.filename}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-[11px] text-muted-foreground font-medium">
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon className="size-3" /> 
                        {formatDate(record.createTime)}
                      </span>
                      <span className="flex items-center gap-1.5 uppercase tracking-tighter font-bold">
                        {record.status}
                      </span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="size-9 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayIcon className="size-4 fill-current" />
                  </Button>
                </div>
              ))
            )}
            {!loading.activity && recentActivity.length === 0 && (
              <div className="py-20 text-center text-sm text-muted-foreground italic">
                Bạn chưa có hồ sơ nào được gán.
              </div>
            )}
          </div>
        </div>

        {/* Side Widgets - 4 columns */}
        <div className="md:col-span-4 space-y-4">
          <div className="rounded-xl border border-border/50 bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1">Tiến độ công việc</h3>
              <p className="text-sm opacity-90 mb-6">Tỷ lệ hoàn thành hồ sơ được gán.</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span>Hoàn thành</span>
                  {loading.total || loading.completed ? (
                    <Skeleton className="h-3 w-10 bg-white/20" />
                  ) : (
                    <span>{stats.completedFiles} / {stats.totalFiles}</span>
                  )}
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-1000" 
                    style={{ width: `${stats.totalFiles > 0 ? (stats.completedFiles / stats.totalFiles) * 100 : 0}%` }} 
                  />
                </div>
              </div>
            </div>
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
