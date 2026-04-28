"use client";

import * as React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="relative overflow-hidden">
          {/* Background Patterns - Bronze Drum */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -top-[200px] -left-[200px] size-[1000px] opacity-[0.15] transition-opacity"
              style={{
                backgroundImage: `url(/vpcp-ui/element/image.png)`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                mixBlendMode: "multiply",
                maskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
              }}
            />
            <div
              className="absolute -right-[200px] -bottom-[200px] size-[1000px] opacity-[0.15] transition-opacity"
              style={{
                backgroundImage: `url(/vpcp-ui/element/image.png)`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                mixBlendMode: "multiply",
                maskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
              }}
            />
          </div>

          <AppHeader />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
