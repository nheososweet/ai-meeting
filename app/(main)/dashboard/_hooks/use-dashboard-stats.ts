"use client";

import { useQuery } from "@tanstack/react-query";
import { iamService } from "@/services/iam.service";
import { filesService } from "@/services/files.service";
import { useAuth } from "@/lib/auth/auth-context";

export function useDashboardStats() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.scope === "global";
  
  // Base params for user view
  const baseParams = isAdmin ? {} : { assigned_filter: true };

  // 1. Total Users (Admin only)
  const usersQuery = useQuery({
    queryKey: ["stats", "users"],
    queryFn: () => iamService.getUsers({ page_size: 1 }),
    enabled: isAdmin,
  });

  // 2. Total Companies (Admin only)
  const companiesQuery = useQuery({
    queryKey: ["stats", "companies"],
    queryFn: () => iamService.getCompanies({ page_size: 1 }),
    enabled: isAdmin,
  });

  // 3. Total Files
  const filesTotalQuery = useQuery({
    queryKey: ["stats", "files", "total", baseParams],
    queryFn: () => filesService.getFiles({ ...baseParams, page_size: 1 }),
  });

  // 4. Completed Files (Transcribe Success)
  const filesCompletedQuery = useQuery({
    queryKey: ["stats", "files", "completed", baseParams],
    queryFn: () => filesService.getFiles({ 
      ...baseParams, 
      page_size: 1, 
      status_step: "transcribe", 
      status_value: "success" 
    }),
  });

  // 5. Waiting Files (Transcribe Waiting)
  const filesWaitingQuery = useQuery({
    queryKey: ["stats", "files", "waiting", baseParams],
    queryFn: () => filesService.getFiles({ 
      ...baseParams, 
      page_size: 1, 
      status_step: "transcribe", 
      status_value: "waiting" 
    }),
  });

  // 6. Recent Activity
  const recentActivityQuery = useQuery({
    queryKey: ["stats", "activity", "recent", baseParams],
    queryFn: () => filesService.getFiles({ ...baseParams, page_size: 5 }),
  });

  return {
    isAdmin,
    stats: {
      users: usersQuery.data?.meta.total_items ?? 0,
      companies: companiesQuery.data?.meta.total_items ?? 0,
      totalFiles: filesTotalQuery.data?.meta.total_items ?? 0,
      completedFiles: filesCompletedQuery.data?.meta.total_items ?? 0,
      waitingFiles: filesWaitingQuery.data?.meta.total_items ?? 0,
    },
    recentActivity: recentActivityQuery.data?.data ?? [],
    companiesList: companiesQuery.data?.data ?? [],
    loading: {
      users: usersQuery.isLoading,
      companies: companiesQuery.isLoading,
      total: filesTotalQuery.isLoading,
      completed: filesCompletedQuery.isLoading,
      waiting: filesWaitingQuery.isLoading,
      activity: recentActivityQuery.isLoading,
    }
  };
}
