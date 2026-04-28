"use client";

import { Search, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Input } from "@/components/ui/input";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-border/70 bg-background/95 backdrop-blur-sm">
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

        {/* Right: User & Theme */}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-sm bg-muted border border-border flex items-center justify-center text-muted-foreground">
              <User size={18} />
            </div>
            <span className="text-sm font-semibold text-foreground hidden sm:inline">Khách</span>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
