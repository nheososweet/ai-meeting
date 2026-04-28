"use client";

import * as React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {/* Background Patterns - Bronze Drum (Fixed at root) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">

        {/* LEFT */}
        {/* <div
          className="absolute -top-[21%] -left-[22%] h-full w-[60%] opacity-60"
          style={{
            backgroundImage: `url(/vpcp-ui/element/image.png)`,
            backgroundSize: "contain",
            backgroundPosition: "left top",
            backgroundRepeat: "no-repeat",
            WebkitMaskImage: "radial-gradient(ellipse at top left, black 40%, transparent 80%)",
            maskImage: "radial-gradient(ellipse at top left, black 40%, transparent 80%)",
          }}
        /> */}
        {/* LEFT */}
        <div
          className="absolute -top-[21%] -left-[22%] h-full w-[60%] opacity-100"
          style={{
            backgroundImage: `url(/vpcp-ui/element/image.png)`,
            backgroundSize: "contain",
            backgroundPosition: "left top",
            backgroundRepeat: "no-repeat",
            WebkitMaskImage: "radial-gradient(ellipse 120% 90% at top left, black 40%, transparent 80%)",
            maskImage: "radial-gradient(ellipse 120% 90% at top left, black 40%, transparent 80%)",
          }}
        />
        {/* RIGHT */}
        <div
          className="absolute -bottom-[20%] -right-[30%] h-full w-full opacity-60"
          style={{
            backgroundImage: `url(/vpcp-ui/element/image.png)`,
            backgroundSize: "contain",
            backgroundPosition: "right bottom",
            backgroundRepeat: "no-repeat",
            WebkitMaskImage: "radial-gradient(ellipse at bottom right, black 40%, transparent 80%)",
            maskImage: "radial-gradient(ellipse at bottom right, black 40%, transparent 80%)",
          }}
        />
      </div>

      <SidebarProvider className="relative z-10 !bg-transparent">
        {/* Override background of inner sidebar */}
        <AppSidebar className="!bg-transparent [&>[data-sidebar=sidebar]]:bg-transparent" />

        <SidebarInset className="relative overflow-hidden bg-transparent md:peer-data-[variant=inset]:bg-transparent/50">
          <AppHeader />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
