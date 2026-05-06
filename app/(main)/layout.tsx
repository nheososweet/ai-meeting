import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { AuthLoadingGate } from "@/components/layout/auth-loading-gate";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthLoadingGate>
      <AppShell>{children}</AppShell>
    </AuthLoadingGate>
  );
}
