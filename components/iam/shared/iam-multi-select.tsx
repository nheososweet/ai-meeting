"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, Loader2, X } from "lucide-react"
import { useInView } from "react-intersection-observer"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useDebounce } from "@/hooks/use-debounce"
import { Badge } from "@/components/ui/badge"

interface IAMMultiSelectProps {
  values: string[]
  onValuesChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  useInfiniteHook: (params: { search?: string }) => any
  labelKey?: string
  valueKey?: string
  disabled?: boolean
  className?: string
  badgeVariant?: "default" | "secondary" | "outline" | "destructive"
}

export function IAMMultiSelect({
  values = [],
  onValuesChange,
  placeholder = "Chọn nhiều mục...",
  searchPlaceholder = "Tìm kiếm...",
  emptyText = "Không tìm thấy kết quả.",
  useInfiniteHook,
  labelKey = "name",
  valueKey = "id",
  disabled = false,
  className,
  badgeVariant = "secondary",
}: IAMMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebounce(search, 500)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteHook({ search: debouncedSearch })

  const { ref, inView } = useInView()

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const items = React.useMemo(() => {
    return data?.pages.flatMap((page: any) => page.data) || []
  }, [data])

  // Track selected items to show labels even if not in current "items" (lazy load)
  // In a real app, we might need to fetch names by IDs if they aren't in memory
  // For now, we'll store the names of items we've encountered
  const [itemCache, setItemCache] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    const newCache = { ...itemCache }
    let changed = false
    items.forEach((item: any) => {
      const val = String(item[valueKey])
      if (!newCache[val]) {
        newCache[val] = item[labelKey]
        changed = true
      }
    })
    if (changed) setItemCache(newCache)
  }, [items, labelKey, valueKey, itemCache])

  const handleSelect = (val: string) => {
    if (values.includes(val)) {
      onValuesChange(values.filter((v) => v !== val))
    } else {
      onValuesChange([...values, val])
    }
  }

  const handleRemove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onValuesChange(values.filter((v) => v !== val))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal min-h-[40px] h-auto py-2",
              values.length === 0 && "text-muted-foreground",
              className
            )}
          >
            <div className="flex flex-wrap gap-1 items-center">
              {values.length > 0 ? (
                values.map((val) => (
                  <Badge
                    key={val}
                    variant={badgeVariant}
                    className="flex items-center gap-1 px-1 py-0 h-6 text-xs"
                  >
                    {itemCache[val] || val}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={(e) => handleRemove(val, e)}
                    />
                  </Badge>
                ))
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <CommandList className="max-h-[300px] overflow-y-auto">
              {isLoading && items.length === 0 && (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải...
                </div>
              )}
              
              {!isLoading && items.length === 0 && (
                <CommandEmpty>{emptyText}</CommandEmpty>
              )}

              <CommandGroup>
                {items.map((item: any) => {
                  const itemValue = String(item[valueKey])
                  const isSelected = values.includes(itemValue)
                  return (
                    <CommandItem
                      key={itemValue}
                      value={itemValue}
                      onSelect={() => handleSelect(itemValue)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {item[labelKey]}
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              {hasNextPage && (
                <div ref={ref} className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
