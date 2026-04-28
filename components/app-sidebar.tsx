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
import { ChevronRightIcon, Clock3Icon, MicIcon } from "lucide-react";

const appNav = {
  main: [
    {
      title: "TRÌNH BIÊN TẬP CUỘC HỌP",
      href: "/workspace",
      icon: MicIcon,
    },
    {
      title: "Lịch sử cuộc họp",
      href: "/history",
      icon: Clock3Icon,
    },
  ],
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
              {appNav.main.map((item) => {
                const isActive =
                  item.href === "/history"
                    ? pathname.startsWith("/history")
                    : pathname === item.href;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-3.5 border-b border-sidebar-border transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-sidebar-foreground hover:text-primary/80"
                    )}
                  >
                    <item.icon className="size-5 shrink-0" />
                    <span className="text-[13px] font-bold uppercase tracking-wide flex-1">
                      {item.title}
                    </span>
                    {/* {isActive && (
                      <ChevronRightIcon className="size-4 shrink-0 text-primary" />
                    )} */}
                  </Link>
                );
              })}
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
