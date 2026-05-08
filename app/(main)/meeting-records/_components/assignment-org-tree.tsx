"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronDown, Building2, Users, Loader2, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox as UICheckbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/use-debounce"
import { useInfiniteCompanies } from "@/hooks/iam/use-companies"
import { useInfiniteGroups } from "@/hooks/iam/use-groups"
import type { Group, Company } from "@/lib/types/iam"

export interface SelectionItem {
  id: string | number
  name: string
}

// --- Helpers ---

interface GroupNodeData extends Group {
  children: GroupNodeData[]
}

function buildGroupTree(flatGroups: Group[]): GroupNodeData[] {
  const map: Record<number, GroupNodeData> = {}
  const roots: GroupNodeData[] = []

  flatGroups.forEach((group) => {
    map[group.id] = { ...group, children: [] }
  })

  flatGroups.forEach((group) => {
    if (group.parent_id && map[group.parent_id]) {
      map[group.parent_id].children.push(map[group.id])
    } else {
      roots.push(map[group.id])
    }
  })

  return roots
}

// --- Components ---

interface AssignmentOrgTreeProps {
  selectedCompanies: SelectionItem[]
  selectedGroups: SelectionItem[]
  onCompanyToggle: (company: SelectionItem) => void
  onGroupToggle: (group: SelectionItem) => void
  disabled?: boolean
}

export function AssignmentOrgTree({
  selectedCompanies,
  selectedGroups,
  onCompanyToggle,
  onGroupToggle,
  disabled = false,
}: AssignmentOrgTreeProps) {
  const [companySearch, setCompanySearch] = React.useState("")
  const debouncedCompanySearch = useDebounce(companySearch, 500)

  const { 
    data: companiesData, 
    isLoading: isLoadingCompanies,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteCompanies({ search: debouncedCompanySearch })
  
  const companies = companiesData?.pages.flatMap((page) => page.data) || []

  // Ghost Companies Logic: Selected companies that are not in the current paginated list
  const displayCompanies = React.useMemo(() => {
    const loadedIds = new Set(companies.map(c => String(c.id)))
    const ghosts = selectedCompanies.filter(sc => !loadedIds.has(String(sc.id)))
    
    // Convert ghosts to Company-like objects for rendering
    const ghostObjects = ghosts.map(g => ({
      id: Number(g.id),
      name: g.name,
      isGhost: true // Flag to distinguish
    })) as unknown as Company[]

    return [...ghostObjects, ...companies]
  }, [companies, selectedCompanies])

  const totalSelected = selectedCompanies.length + selectedGroups.length

  return (
    <div className="space-y-3 border rounded-md p-4 bg-muted/5 flex flex-col">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Cơ cấu tổ chức tiếp nhận
          </p>
          {totalSelected > 0 && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
              Đã chọn {totalSelected}
            </span>
          )}
        </div>

        {/* Selected Summary Bar */}
        {totalSelected > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 bg-background border rounded-md min-h-[40px]">
            {selectedCompanies.map(c => (
              <Badge key={`sel-c-${c.id}`} variant="secondary" className="pl-2 pr-1 py-0 h-6 text-[11px] flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100">
                <Building2 className="size-3" />
                <span className="max-w-[120px] truncate">{c.name}</span>
                <button 
                  onClick={() => onCompanyToggle(c)}
                  disabled={disabled}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {selectedGroups.map(g => (
              <Badge key={`sel-g-${g.id}`} variant="secondary" className="pl-2 pr-1 py-0 h-6 text-[11px] flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100">
                <Users className="size-3" />
                <span className="max-w-[120px] truncate">{g.name}</span>
                <button 
                  onClick={() => onGroupToggle(g)}
                  disabled={disabled}
                  className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="relative">
          <Input
            placeholder="Tìm công ty..."
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            disabled={disabled}
            className="h-8 text-xs pl-8"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {isLoadingCompanies ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin mr-2" />
            Đang tải dữ liệu...
          </div>
        ) : companies.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {companySearch ? "Không tìm thấy công ty phù hợp." : "Chưa có dữ liệu công ty."}
          </div>
        ) : (
          displayCompanies.map((company) => (
            <CompanyNode
              key={company.id}
              company={company}
              selectedCompanies={selectedCompanies}
              selectedGroups={selectedGroups}
              onCompanyToggle={onCompanyToggle}
              onGroupToggle={onGroupToggle}
              disabled={disabled}
            />
          ))
        )}
        
        {hasNextPage && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-[11px] h-7 text-primary hover:bg-primary/5"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Loader2 className="size-3 animate-spin mr-2" />
            ) : null}
            Tải thêm công ty...
          </Button>
        )}
      </div>
    </div>
  )
}

function CompanyNode({
  company,
  selectedCompanies,
  selectedGroups,
  onCompanyToggle,
  onGroupToggle,
  disabled,
}: {
  company: Company
  selectedCompanies: SelectionItem[]
  selectedGroups: SelectionItem[]
  onCompanyToggle: (company: SelectionItem) => void
  onGroupToggle: (group: SelectionItem) => void
  disabled?: boolean
}) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [groupSearch, setGroupSearch] = React.useState("")
  const debouncedGroupSearch = useDebounce(groupSearch, 500)
  

  // Use Infinite Groups
  const { 
    data: groupsData, 
    isLoading: isLoadingGroups,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteGroups(
    isExpanded ? company.id : null, 
    { search: debouncedGroupSearch }
  )
  
  const groups = groupsData?.pages.flatMap((page) => page.data) || []
  
  // Ghost Groups Logic: Selected groups belonging to this company that are not in the current loaded list
  const displayGroups = React.useMemo(() => {
    const loadedIds = new Set(groups.map(g => String(g.id)))
    const ghosts = selectedGroups.filter(sg => {
      // If we don't have company_id in SelectionItem, we can only rely on the fact they are passed here
      // But actually groups from API have company_id. 
      // For ghosts, we might not know their company_id unless we fetch it.
      // However, usually the initial data from assigned_to_groups has company_id or we can pass it.
      // If not, we show all selected groups in all expanded companies? No.
      // Let's assume SelectionItem might have company_id if possible, or just skip filtering by company for ghosts
      // and let the user see them in the summary bar. 
      // BETTER: For now, if it's a ghost group and we are in the "correct" company node, show it.
      // But how do we know the "correct" company node? 
      // The user example had "assigned_to_companies" and "assigned_to_groups" as separate flat lists.
      return !loadedIds.has(String(sg.id)) && (sg as any).company_id === company.id
    })

    const ghostObjects = ghosts.map(g => ({
      ...g,
      id: Number(g.id),
      company_id: company.id,
      isGhost: true
    })) as unknown as Group[]

    return [...ghostObjects, ...groups]
  }, [groups, selectedGroups, company.id])

  const groupTree = React.useMemo(() => buildGroupTree(displayGroups), [displayGroups])
  
  const isSelected = selectedCompanies.some(c => String(c.id) === String(company.id))

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 group py-1 hover:bg-muted/50 rounded px-1 transition-colors">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 hover:bg-muted rounded text-muted-foreground transition-transform"
          style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        >
          <ChevronDown className="size-4" />
        </button>
        
        <UICheckbox
          id={`company-${company.id}`}
          checked={isSelected}
          onCheckedChange={() => onCompanyToggle({ id: String(company.id), name: company.name })}
          disabled={disabled}
        />
        
        <div className="flex items-center gap-2 cursor-pointer select-none flex-1" onClick={() => setIsExpanded(!isExpanded)}>
          <Building2 className="size-4 text-blue-500 shrink-0" />
          <span className="text-sm font-medium line-clamp-1">{company.name}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="pl-9 space-y-2 border-l ml-2.5 border-border/60 pb-1">
          {/* Internal Search for Groups */}
          <div className="relative mt-1">
            <Input
              placeholder={`Tìm trong ${company.name}...`}
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              disabled={disabled}
              className="h-7 text-[11px] pl-7 bg-background"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          </div>

          {isLoadingGroups ? (
            <div className="flex items-center py-2 text-xs text-muted-foreground italic">
              <Loader2 className="size-3 animate-spin mr-2" />
              Đang tải phòng ban...
            </div>
          ) : groups.length === 0 ? (
            <div className="py-1 text-xs text-muted-foreground italic pl-2">
              {debouncedGroupSearch ? "Không tìm thấy phòng ban." : "Chưa có phòng ban."}
            </div>
          ) : (
            <>
              {groupTree.map((node) => (
                <GroupNode
                  key={node.id}
                  node={node}
                  selectedGroups={selectedGroups}
                  onGroupToggle={onGroupToggle}
                  disabled={disabled}
                />
              ))}
              
              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-[10px] text-primary hover:underline pl-6 py-1 flex items-center gap-1 disabled:opacity-50"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="size-2 animate-spin" />
                  ) : null}
                  Xem thêm phòng ban...
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function GroupNode({
  node,
  selectedGroups,
  onGroupToggle,
  disabled,
  depth = 0,
}: {
  node: GroupNodeData
  selectedGroups: SelectionItem[]
  onGroupToggle: (group: SelectionItem) => void
  disabled?: boolean
  depth?: number
}) {
  const isSelected = selectedGroups.some(g => String(g.id) === String(node.id))
  const [isExpanded, setIsExpanded] = React.useState(true) // Groups often small enough to show by default
  const hasChildren = node.children.length > 0

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 py-1 group hover:bg-muted/50 rounded px-1 transition-colors">
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-muted rounded text-muted-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
        ) : (
          <div className="size-4.5" /> // Spacer
        )}

        <UICheckbox
          id={`group-${node.id}`}
          checked={isSelected}
          onCheckedChange={() => onGroupToggle({ id: String(node.id), name: node.name, company_id: node.company_id } as any)}
          disabled={disabled}
        />

        <div className="flex items-center gap-2">
          <Users className={cn("size-3.5", depth === 0 ? "text-purple-500" : "text-amber-500")} />
          <span className="text-sm">{node.name}</span>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="pl-6 space-y-1 border-l ml-2 border-border/40">
          {node.children.map((child) => (
              <GroupNode
                key={child.id}
                node={child}
                selectedGroups={selectedGroups}
                onGroupToggle={onGroupToggle}
                disabled={disabled}
                depth={depth + 1}
              />
          ))}
        </div>
      )}
    </div>
  )
}
