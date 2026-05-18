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
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/use-debounce"

export interface IAMSelectionItem {
  id: string | number
  name: string
}

type IAMComboboxBaseProps = {
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  useInfiniteHook: (params: { search?: string }) => any
  labelKey?: string
  valueKey?: string
  disabled?: boolean
  className?: string
}

type IAMComboboxSingleProps = IAMComboboxBaseProps & {
  multiple?: false
  value?: string
  onValueChange: (value: string) => void
  /** Label to display if value is set but item not yet loaded in lazy list */
  selectedLabel?: string
}

type IAMComboboxMultiProps = IAMComboboxBaseProps & {
  multiple: true
  selectedItems: IAMSelectionItem[]
  onToggle: (item: IAMSelectionItem) => void
}

export type IAMComboboxProps = IAMComboboxSingleProps | IAMComboboxMultiProps

export function IAMCombobox(props: IAMComboboxProps) {
  const {
    placeholder = "Chọn mục...",
    searchPlaceholder = "Tìm kiếm...",
    emptyText = "Không tìm thấy kết quả.",
    useInfiniteHook,
    labelKey = "name",
    valueKey = "id",
    disabled = false,
    className,
  } = props

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

  const isMulti = props.multiple === true

  // Single mode values (safe to access unconditionally via cast)
  const singleValue = !isMulti ? (props as IAMComboboxSingleProps).value : undefined
  const externalSelectedLabel = !isMulti ? (props as IAMComboboxSingleProps).selectedLabel : undefined
  const multiSelectedItems = isMulti ? (props as IAMComboboxMultiProps).selectedItems : []
  const onToggle = isMulti ? (props as IAMComboboxMultiProps).onToggle : undefined

  const displayLabel = React.useMemo(() => {
    if (isMulti) return ""
    if (!singleValue || singleValue === "") return ""
    const selectedItem = items.find((item: any) => String(item[valueKey]) === String(singleValue))
    if (selectedItem) return selectedItem[labelKey]
    if (externalSelectedLabel) return externalSelectedLabel
    return ""
  }, [isMulti, singleValue, items, labelKey, valueKey, externalSelectedLabel])

  const isSelected = (itemValue: string) => {
    if (isMulti) return multiSelectedItems.some(s => String(s.id) === itemValue)
    return String(singleValue) === itemValue
  }

  const handleItemSelect = (itemValue: string, itemLabel: string) => {
    if (isMulti) {
      onToggle!({ id: itemValue, name: itemLabel })
      // keep popover open for multi-select
    } else {
      const { onValueChange } = props as IAMComboboxSingleProps
      onValueChange(itemValue === singleValue ? "" : itemValue)
      setOpen(false)
    }
  }

  const triggerLabel = isMulti
    ? multiSelectedItems.length > 0
      ? `${multiSelectedItems.length} đã chọn`
      : placeholder
    : (displayLabel || placeholder)

  const triggerMuted = isMulti
    ? multiSelectedItems.length === 0
    : (!singleValue || singleValue === "")

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn("w-full justify-between font-normal", triggerMuted && "text-muted-foreground")}
          >
            {triggerLabel}
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
                  const itemLabel = item[labelKey]
                  return (
                    <CommandItem
                      key={itemValue}
                      value={itemValue}
                      onSelect={() => handleItemSelect(itemValue, itemLabel)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected(itemValue) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {itemLabel}
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

      {/* Multi mode: selected tags */}
      {isMulti && multiSelectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {multiSelectedItems.map((item) => (
            <Badge
              key={String(item.id)}
              variant="secondary"
              className="flex items-center gap-1 pl-2 pr-1 py-0.5 text-xs"
            >
              {item.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onToggle!(item)}
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
