import {
  FilesIcon,
  CheckCircle2Icon,
  UsersIcon,
  ClockIcon,
  Building2Icon,
  ArrowUpRightIcon
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "./stats-card";
import { cn, formatDate } from "@/lib/utils";
import { useDashboardStats } from "../_hooks/use-dashboard-stats";

export function AdminView() {
  const { stats, recentActivity, loading } = useDashboardStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top row stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng số bản ghi"
          value={stats.totalFiles.toLocaleString()}
          description="Toàn bộ hệ thống"
          icon={FilesIcon}
          isLoading={loading.total}
        />
        <StatsCard
          title="Chờ xử lý"
          value={stats.waitingFiles.toLocaleString()}
          description="Băng dịch đang chờ (waiting)"
          icon={ClockIcon}
          className="border-amber-100/50"
          isLoading={loading.waiting}
        />
        <StatsCard
          title="Đã hoàn thành"
          value={stats.completedFiles.toLocaleString()}
          description="Băng dịch thành công (success)"
          icon={CheckCircle2Icon}
          className="border-emerald-100/50"
          isLoading={loading.completed}
        />
        <StatsCard
          title="Đơn vị & Thành viên"
          value={stats.companies + stats.users}
          description={`${stats.companies} đơn vị, ${stats.users} thành viên`}
          icon={Building2Icon}
          className="border-blue-100/50"
          isLoading={loading.companies || loading.users}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Latest Global Activity - 8 columns */}
        <div className="md:col-span-8 rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-foreground">Bản ghi mới cập nhật</h3>
            <Link href="/meeting-records">
              <Button variant="outline" size="sm" className="h-8 text-xs px-4">
                Xem tất cả
              </Button>
            </Link>
          </div>
          <div className="space-y-1">
            {loading.activity ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3.5">
                  <Skeleton className="size-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))
            ) : (
              recentActivity.map((record) => (
                <div key={record.id} className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-muted/40 transition-all group border border-transparent hover:border-border/50">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                    <FilesIcon className="size-5 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold truncate pr-4 text-foreground/90">
                        {record.title || record.filename}
                      </p>
                      <span className={cn(
                        "text-xs font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider",
                        record.status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          record.status === "failed" ? "bg-rose-100 text-rose-700 border border-rose-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                      )}>
                        {record.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 mt-1.5 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="size-3.5 text-primary/50" />
                        {formatDate(record.createTime)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2Icon className="size-3.5 text-primary/50" />
                        ID: {record.id}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {!loading.activity && recentActivity.length === 0 && (
              <div className="py-20 text-center text-sm text-muted-foreground italic">
                Chưa có hoạt động nào được ghi nhận.
              </div>
            )}
          </div>
        </div>

        {/* System Overview - 4 columns */}
        <div className="md:col-span-4 space-y-6">
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-lg text-foreground">Thành phần hệ thống</h3>
              <UsersIcon className="size-5 text-muted-foreground/50" />
            </div>
            <div className="space-y-6">
              <div className="group flex items-center justify-between p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 transition-all hover:border-primary/30">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UsersIcon className="size-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Người dùng</p>
                    {loading.users ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-2xl font-black text-primary">{stats.users}</p>
                    )}
                  </div>
                </div>
                <UsersIcon className="size-10 text-primary/5" />
              </div>

              <div className="group flex items-center justify-between p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-transparent border border-blue-100 transition-all hover:border-blue-200">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2Icon className="size-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Đơn vị / Công ty</p>
                    {loading.companies ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className="text-2xl font-black text-blue-600">{stats.companies}</p>
                    )}
                  </div>
                </div>
                <Building2Icon className="size-10 text-blue-600/5" />
              </div>
            </div>

            {/* <div className="mt-12 pt-8 border-t border-dashed border-border/50 text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dữ liệu được cập nhật dựa trên `transcribe` step.
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
