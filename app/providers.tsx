"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ToastProvider } from "@/components/providers/toast-provider";
import { BackgroundTaskProvider } from "@/components/providers/background-task-context";
import { MeetingPipelineProvider } from "@/components/providers/meeting-pipeline-context";
import { TaskProgressBubble } from "@/components/background-tasks/task-progress-bubble";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 10_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BackgroundTaskProvider>
          <MeetingPipelineProvider>
            {children}
            <ToastProvider />
            <TaskProgressBubble />
          </MeetingPipelineProvider>
        </BackgroundTaskProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
