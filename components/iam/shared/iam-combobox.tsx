"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react"
import { useInView } from "react-intersection-observer"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useDebounce } from "@/hooks/use-debounce" // Assuming this hook exists or we'll create it

interface IAMComboboxProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  useInfiniteHook: (params: { search?: string }) => any
  labelKey?: string
  valueKey?: string
  disabled?: boolean
  className?: string
}

export function IAMCombobox({
  value,
  onValueChange,
  placeholder = "Chọn mục...",
  searchPlaceholder = "Tìm kiếm...",
  emptyText = "Không tìm thấy kết quả.",
  useInfiniteHook,
  labelKey = "name",
  valueKey = "id",
  disabled = false,
  className,
}: IAMComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebounce(search, 500)

  // Fetch data using the provided infinite hook
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteHook({ search: debouncedSearch })

  const { ref, inView } = useInView()

  // Load more when reaching the bottom
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Flatten the pages into a single list of items
  const items = React.useMemo(() => {
    return data?.pages.flatMap((page: any) => page.data) || []
  }, [data])

  // Find the label for the current value
  const selectedLabel = React.useMemo(() => {
    if (!value || value === "") return ""
    const selectedItem = items.find((item: any) => String(item[valueKey]) === String(value))
    return selectedItem ? selectedItem[labelKey] : ""
  }, [value, items, labelKey, valueKey])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
        >
          {selectedLabel || placeholder}
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
            {isLoading && (
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
                return (
                  <CommandItem
                    key={itemValue}
                    value={itemValue}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === itemValue ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item[labelKey]}
                  </CommandItem>
                )
              })}
            </CommandGroup>

            {/* Loading sentinel */}
            {hasNextPage && (
              <div ref={ref} className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
