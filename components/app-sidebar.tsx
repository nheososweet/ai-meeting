"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Clock3Icon, FolderKanbanIcon, LayoutDashboardIcon, MicIcon, ShieldIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { IAM_SIDEBAR_PERMISSIONS, WBS_SIDEBAR_PERMISSIONS } from "@/lib/auth/permissions";

const appNav = {
  main: [
    {
      title: "TRÌNH BIÊN TẬP CUỘC HỌP",
      href: "/workspace",
      icon: MicIcon,
      requiredPerms: ["transcribe"],
    },
    {
      title: "Trình biên tập (Mới)",
      href: "/meeting",
      icon: LayoutDashboardIcon,
      requiredPerms: ["transcribe"],
    },
    {
      title: "Lịch sử cuộc họp",
      href: "/history",
      icon: Clock3Icon,
      requiredPerms: ["view_records"],
    },
  ],
  iam: {
    title: "Quản trị hệ thống",
    href: "/iam",
    icon: ShieldIcon,
  },
  meetingRecords: {
    title: "Bản ghi cuộc họp",
    href: "/meeting-records",
    icon: FolderKanbanIcon,
  },
  support: [
    // {
    //   title: "Mẫu biên bản",
    //   href: "/history",
    //   icon: FileTextIcon,
    // },
    // {
    //   title: "Nhật ký email",
    //   href: "/history",
    //   icon: MailIcon,
    // },
  ],
  user: {
    name: "Điều phối viên",
    role: "Trung tâm phiên dịch",
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { hasAnyPermission } = useAuth();

  const canSeeIam = hasAnyPermission(IAM_SIDEBAR_PERMISSIONS);
  const isIamActive = pathname.startsWith("/iam");

  const canSeeMeetingRecords = hasAnyPermission(WBS_SIDEBAR_PERMISSIONS);
  const isMeetingRecordsActive = pathname.startsWith("/meeting-records");

  const visibleMain = appNav.main.filter((item: any) => 
    !item.requiredPerms || hasAnyPermission(item.requiredPerms)
  );

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="items-center gap-3 px-4 pt-4 pb-3 border-b border-sidebar-border">
        <div className="relative w-12 h-12 shrink-0">
          <Image
            src="/vpcp-ui/element/quoc_huy.png"
            alt="Quốc Huy"
            fill
            className="object-contain"
          />
        </div>
        <h2 className="text-[11px] font-extrabold leading-tight text-primary uppercase text-center tracking-wide">
          Hệ thống biên tập và tổng hợp cuộc họp thông minh
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <nav className="flex flex-col">
              {visibleMain.map((item) => {
                const isActive =
                  item.href === "/history"
                    ? pathname.startsWith("/history")
                    : pathname === item.href;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-3.5 border-b border-sidebar-border transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-sidebar-foreground hover:text-primary"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-primary/10 text-primary group-hover:bg-primary/20"
                      )}
                    >
                      <item.icon className="size-[18px]" />
                    </div>
                    <span className="text-[13px] font-bold uppercase tracking-wide flex-1">
                      {item.title}
                    </span>
                    {/* {isActive && (
                      <ChevronRightIcon className="size-4 shrink-0 text-primary" />
                    )} */}
                  </Link>
                );
              })}

              {/* Meeting Records Navigation — Sidebar Guard */}
              {canSeeMeetingRecords && (
                <Link
                  href={appNav.meetingRecords.href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-3.5 border-b border-sidebar-border transition-colors",
                    isMeetingRecordsActive
                      ? "text-primary"
                      : "text-sidebar-foreground hover:text-primary"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
                      isMeetingRecordsActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-primary/10 text-primary group-hover:bg-primary/20"
                    )}
                  >
                    <appNav.meetingRecords.icon className="size-[18px]" />
                  </div>
                  <span className="text-[13px] font-bold uppercase tracking-wide flex-1">
                    {appNav.meetingRecords.title}
                  </span>
                </Link>
              )}

              {/* IAM Navigation — Sidebar Guard */}
              {canSeeIam && (
                <Link
                  href={appNav.iam.href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-3.5 border-b border-sidebar-border transition-colors",
                    isIamActive
                      ? "text-primary"
                      : "text-sidebar-foreground hover:text-primary"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
                      isIamActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-primary/10 text-primary group-hover:bg-primary/20"
                    )}
                  >
                    <appNav.iam.icon className="size-[18px]" />
                  </div>
                  <span className="text-[13px] font-bold uppercase tracking-wide flex-1">
                    {appNav.iam.title}
                  </span>
                </Link>
              )}
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* <SidebarFooter>
        <div className="rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-xs">
          <p className="font-semibold text-sidebar-foreground">
            {appNav.user.name}
          </p>
          <p className="text-sidebar-foreground/70">{appNav.user.role}</p>
        </div>
      </SidebarFooter> */}
    </Sidebar>
  );
}
