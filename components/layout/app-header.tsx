"use client";

import { Search, LogOutIcon, ShieldIcon, ChevronsUpDownIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name: string): string {
  if (!name) return "KH";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "admin": return "Quản trị viên";
    case "member": return "Thành viên";
    default: return role;
  }
}

export function AppHeader() {
  const { currentUser, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-border/30 bg-transparent">
      <div className="flex w-full items-center gap-2 px-4 md:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-1 data-vertical:h-4 data-vertical:self-auto"
        />

        {/* Search */}
        <div className="flex-1 max-w-sm">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full h-9 pl-9 pr-4 bg-white/90 border-none focus-visible:ring-1 focus-visible:ring-ring transition-all text-sm shadow-sm"
            />
          </div>
        </div>

        {/* Right: User Menu */}
        <div className="ml-auto flex items-center gap-4">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 outline-none rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors">
                <Avatar className="size-8 rounded-md overflow-hidden">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold rounded-md">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-sm font-semibold text-foreground leading-none">
                    {currentUser.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1 leading-none capitalize">
                    {getRoleLabel(currentUser.role)}
                  </span>
                </div>
                <ChevronsUpDownIcon className="size-4 text-muted-foreground ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-lg">
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-md overflow-hidden">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold rounded-md">
                        {getInitials(currentUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{currentUser.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{currentUser.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <ShieldIcon className="size-4 text-muted-foreground" />
                    <span className="flex-1">{getRoleLabel(currentUser.role)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-muted-foreground capitalize">
                      {currentUser.scope}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-destructive cursor-pointer" onClick={() => logout()}>
                  <LogOutIcon className="size-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 opacity-50">
              <div className="size-8 rounded-sm bg-muted border border-border flex items-center justify-center text-muted-foreground">
                <span className="text-xs">...</span>
              </div>
              <span className="text-sm font-semibold text-foreground hidden sm:inline">Đang tải...</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
