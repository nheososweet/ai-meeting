"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface DataTablePaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  isFetching?: boolean;
  className?: string;
}

export function DataTablePagination({
  meta,
  onPageChange,
  itemLabel = "bản ghi",
  isFetching = false,
  className,
}: DataTablePaginationProps) {
  if (!meta || meta.total_pages <= 1) return null;

  const { page, total_pages, page_size, total_items, has_next, has_prev } = meta;

  const startItem = (page - 1) * page_size + 1;
  const endItem = Math.min(page * page_size, total_items);

  return (
    <div className={cn("flex items-center justify-between py-2", className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isFetching && <Loader2Icon className="size-3 animate-spin" />}
        <span>
          Hiển thị <span className="font-medium text-foreground">{startItem}</span> -{" "}
          <span className="font-medium text-foreground">{endItem}</span> trong{" "}
          <span className="font-medium text-foreground">{total_items}</span> {itemLabel}
        </span>
      </div>

      <Pagination className="w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={(e) => {
                e.preventDefault();
                if (has_prev) onPageChange(page - 1);
              }}
              className={cn(
                "cursor-pointer h-8 text-[11px]",
                (!has_prev || isFetching) && "pointer-events-none opacity-50"
              )}
              text="Trước"
            />
          </PaginationItem>

          {Array.from({ length: total_pages }, (_, i) => i + 1).map((p) => {
            if (
              p === 1 ||
              p === total_pages ||
              (p >= page - 1 && p <= page + 1)
            ) {
              return (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === page}
                    onClick={(e) => {
                      e.preventDefault();
                      if (p !== page) onPageChange(p);
                    }}
                    className={cn(
                      "cursor-pointer h-8 w-8 text-[11px]",
                      isFetching && p !== page && "pointer-events-none opacity-50"
                    )}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              );
            }
            if (p === page - 2 || p === page + 2) {
              return (
                <PaginationItem key={p}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return null;
          })}

          <PaginationItem>
            <PaginationNext
              onClick={(e) => {
                e.preventDefault();
                if (has_next) onPageChange(page + 1);
              }}
              className={cn(
                "cursor-pointer h-8 text-[11px]",
                (!has_next || isFetching) && "pointer-events-none opacity-50"
              )}
              text="Sau"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
