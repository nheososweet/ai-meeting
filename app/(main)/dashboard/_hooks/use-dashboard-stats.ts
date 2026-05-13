"use client";

import { useQuery } from "@tanstack/react-query";
import { iamService } from "@/services/iam.service";
import { filesService } from "@/services/files.service";
import { useAuth } from "@/lib/auth/auth-context";

const STATS_STALE_TIME = 2 * 60 * 1000;   // 2 phút
const STATS_GC_TIME = 5 * 60 * 1000;      // 5 phút
const STATS_REFETCH_INTERVAL = 60 * 1000; // auto-refresh 60 giây

export function useDashboardStats() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.scope === "global";

  // Base params for user view
  const baseParams = isAdmin ? {} : { assigned_filter: true };

  const sharedQueryConfig = {
    staleTime: STATS_STALE_TIME,
    gcTime: STATS_GC_TIME,
    refetchInterval: STATS_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
  };

  // 1. Total Users (Admin only)
  const usersQuery = useQuery({
    queryKey: ["stats", "users"],
    queryFn: () => iamService.getUsers({ page_size: 1 }),
    enabled: isAdmin,
    ...sharedQueryConfig,
  });

  // 2. Total Companies (Admin only)
  const companiesQuery = useQuery({
    queryKey: ["stats", "companies"],
    queryFn: () => iamService.getCompanies({ page_size: 1 }),
    enabled: isAdmin,
    ...sharedQueryConfig,
  });

  // 3. Completed Files (Transcribe Success)
  const filesCompletedQuery = useQuery({
    queryKey: ["stats", "files", "completed", baseParams],
    queryFn: () => filesService.getFiles({
      ...baseParams,
      page_size: 1,
      status_step: "transcribe",
      status_value: "success"
    }),
    ...sharedQueryConfig,
  });

  // 4. Waiting Files (Transcribe Waiting)
  const filesWaitingQuery = useQuery({
    queryKey: ["stats", "files", "waiting", baseParams],
    queryFn: () => filesService.getFiles({
      ...baseParams,
      page_size: 1,
      status_step: "transcribe",
      status_value: "waiting"
    }),
    ...sharedQueryConfig,
  });

  // 5. Recent Activity — đồng thời cung cấp total_items (gộp với filesTotalQuery cũ)
  const recentActivityQuery = useQuery({
    queryKey: ["stats", "activity", "recent", baseParams],
    queryFn: () => filesService.getFiles({ ...baseParams, page_size: 5 }),
    ...sharedQueryConfig,
  });

  return {
    isAdmin,
    stats: {
      users: usersQuery.data?.meta.total_items ?? 0,
      companies: companiesQuery.data?.meta.total_items ?? 0,
      totalFiles: recentActivityQuery.data?.meta.total_items ?? 0,
      completedFiles: filesCompletedQuery.data?.meta.total_items ?? 0,
      waitingFiles: filesWaitingQuery.data?.meta.total_items ?? 0,
    },
    recentActivity: recentActivityQuery.data?.data ?? [],
    companiesList: companiesQuery.data?.data ?? [],
    loading: {
      users: usersQuery.isLoading,
      companies: companiesQuery.isLoading,
      total: recentActivityQuery.isLoading,
      completed: filesCompletedQuery.isLoading,
      waiting: filesWaitingQuery.isLoading,
      activity: recentActivityQuery.isLoading,
    }
  };
}
