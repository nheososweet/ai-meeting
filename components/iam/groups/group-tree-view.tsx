"use client"

import * as React from "react"
import { ChevronRightIcon, ChevronDownIcon, UsersIcon, ShieldIcon, PlusIcon, PencilIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Group } from "@/lib/types/iam"
import { useAuth } from "@/lib/auth/auth-context"

// ══════════════════════════════════════════════════════════
// Types & Utilities
// ══════════════════════════════════════════════════════════

export interface GroupTreeNode extends Group {
  children: GroupTreeNode[]
  level: number
}

/**
 * Builds a recursive tree structure from a flat list of groups using parent_id.
 */
export function buildGroupTree(flatGroups: Group[]): GroupTreeNode[] {
  const map = new Map<number, GroupTreeNode>()
  const roots: GroupTreeNode[] = []

  // 1. Initialize all nodes
  flatGroups.forEach((g) => {
    map.set(g.id, { ...g, children: [], level: 0 })
  })

  // 2. Build parent-child relationships
  flatGroups.forEach((g) => {
    const node = map.get(g.id)!
    if (g.parent_id && map.has(g.parent_id)) {
      const parent = map.get(g.parent_id)!
      node.level = parent.level + 1 // Temporary, will be recalculated if needed
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  // 3. Recalculate levels correctly starting from roots
  const setLevels = (nodes: GroupTreeNode[], level: number) => {
    nodes.forEach((node) => {
      node.level = level
      if (node.children.length > 0) {
        setLevels(node.children, level + 1)
      }
    })
  }
  setLevels(roots, 0)

  return roots
}

// ══════════════════════════════════════════════════════════
// Internal Components
// ══════════════════════════════════════════════════════════

interface TreeItemProps {
  node: GroupTreeNode
  onAssignPerms: (group: Group) => void
  onAddChild: (group: Group) => void
  onEdit: (group: Group) => void
  canManage: boolean
}

function TreeItem({ node, onAssignPerms, onAddChild, onEdit, canManage }: TreeItemProps) {
  const { hasPermission } = useAuth()
  const [isExpanded, setIsExpanded] = React.useState(true)
  const hasChildren = node.children.length > 0

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "group flex items-center gap-2 py-2 px-3 rounded-md transition-colors hover:bg-muted/50",
          "relative"
        )}
      >
        {/* Indent Lines */}
        {Array.from({ length: node.level }).map((_, i) => (
          <div
            key={i}
            className="w-6 h-full absolute border-l border-border/40"
            style={{ left: `${(i + 1) * 24 - 12}px` }}
          />
        ))}

        <div style={{ width: `${node.level * 24}px` }} className="shrink-0" />

        {/* Toggle Icon */}
        <div className="size-6 flex items-center justify-center shrink-0">
          {hasChildren ? (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-accent rounded-sm p-0.5 transition-all active:scale-95 group/toggle"
            >
              {isExpanded ? (
                <ChevronDownIcon className="size-4 text-muted-foreground group-hover/toggle:text-white transition-colors" />
              ) : (
                <ChevronRightIcon className="size-4 text-muted-foreground group-hover/toggle:text-white transition-colors" />
              )}
            </button>
          ) : (
            <div className="size-1 rounded-full bg-border/60 mx-auto" />
          )}
        </div>

        {/* Group Icon & Name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <UsersIcon className="size-4 text-primary/70 shrink-0" />
          <span className="font-medium text-sm truncate">{node.name}</span>
          <span className="text-[10px] text-muted-foreground/60 px-1.5 py-0.5 bg-muted rounded border border-border/40">
            ID: {node.id}
          </span>
        </div>

        {/* Actions (Visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasPermission("assign_permissions") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] px-2"
              onClick={() => onAssignPerms(node)}
            >
              <ShieldIcon className="mr-1.5 size-3" />
              Phân quyền
            </Button>
          )}
          
          {canManage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2"
                onClick={() => onAddChild(node)}
              >
                <PlusIcon className="mr-1.5 size-3" />
                Thêm con
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => onEdit(node)}
              >
                <PencilIcon className="size-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Recursive Children */}
      {isExpanded && hasChildren && (
        <div className="flex flex-col">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              onAssignPerms={onAssignPerms}
              onAddChild={onAddChild}
              onEdit={onEdit}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════

export interface GroupTreeViewProps {
  groups: Group[]
  onAssignPerms: (group: Group) => void
  onAddChild: (group: Group) => void
  onEdit: (group: Group) => void
  canManage: boolean
  isLoading?: boolean
}

export function GroupTreeView({
  groups,
  onAssignPerms,
  onAddChild,
  onEdit,
  canManage,
  isLoading
}: GroupTreeViewProps) {
  const treeData = React.useMemo(() => buildGroupTree(groups), [groups])

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-md" />
        ))}
      </div>
    )
  }

  if (treeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <UsersIcon className="size-10 opacity-20 mb-3" />
        <p className="text-sm">Chưa có nhóm nào được tạo.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-1">
      {treeData.map((root) => (
        <TreeItem
          key={root.id}
          node={root}
          onAssignPerms={onAssignPerms}
          onAddChild={onAddChild}
          onEdit={onEdit}
          canManage={canManage}
        />
      ))}
    </div>
  )
}
