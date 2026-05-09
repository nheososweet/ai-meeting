"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { Loader2Icon } from "lucide-react";
import { AdminView } from "./_components/admin-view";
import { UserView } from "./_components/user-view";

export default function DashboardPage() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-primary/60" />
      </div>
    );
  }

  // Determine which view to show based on scope
  const isAdmin = currentUser?.scope === "global";

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 overflow-y-auto">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          {isAdmin ? "Hệ thống tổng quát" : "Bảng tin cá nhân"}
        </h2>
      </div>

      {isAdmin ? <AdminView /> : <UserView />}
    </div>
  );
}
