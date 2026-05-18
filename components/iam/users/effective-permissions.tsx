"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { ShieldCheckIcon, UsersIcon, UserIcon } from "lucide-react"
import { mockRoles, mockGroups, mockPermissions, resolveEffectivePermissions } from "@/lib/mock/iam"
import type { IamUser, IamPermission } from "@/lib/types/iam"

function getPermLabel(code: string, permissions: IamPermission[]): string {
  for (const p of permissions) {
    if (p.code === code) return p.label
    if (p.children) {
      const found = getPermLabel(code, p.children)
      if (found) return found
    }
  }
  return code
}

interface EffectivePermissionsProps {
  user: IamUser
}

export function EffectivePermissions({ user }: EffectivePermissionsProps) {
  const effectivePerms = useMemo(
    () => resolveEffectivePermissions(user, mockRoles, mockGroups, mockPermissions),
    [user],
  )

  const directRoles = mockRoles.filter((r) => user.roleIds.includes(r.id))

  // Roles from groups
  const groupRoleNames = useMemo(() => {
    const names: { groupName: string; roleName: string }[] = []
    function walk(groups: typeof mockGroups) {
      for (const g of groups) {
        if (user.groupIds.includes(g.id)) {
          for (const rid of g.roleIds) {
            const role = mockRoles.find((r) => r.id === rid)
            if (role) names.push({ groupName: g.name, roleName: role.name })
          }
        }
        if (g.children) walk(g.children)
      }
    }
    walk(mockGroups)
    return names
  }, [user])

  return (
    <div className="space-y-4">
      {/* Direct roles */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wide">
          <UserIcon className="size-3.5" />
          Vai trò trực tiếp
        </div>
        <div className="flex flex-wrap gap-1.5">
          {directRoles.length === 0 ? (
            <span className="text-xs text-muted-foreground">Chưa gán vai trò.</span>
          ) : (
            directRoles.map((r) => (
              <Badge key={r.id} variant="secondary" className="text-xs">{r.name}</Badge>
            ))
          )}
        </div>
      </div>

      {/* Roles from groups */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wide">
          <UsersIcon className="size-3.5" />
          Vai trò từ nhóm
        </div>
        <div className="flex flex-wrap gap-1.5">
          {groupRoleNames.length === 0 ? (
            <span className="text-xs text-muted-foreground">Không có.</span>
          ) : (
            groupRoleNames.map((item, i) => (
              <Badge key={i} variant="outline" className="text-xs gap-1">
                {item.roleName}
                <span className="text-xs text-muted-foreground">({item.groupName})</span>
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Effective permissions */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wide">
          <ShieldCheckIcon className="size-3.5" />
          Tổng hợp quyền ({effectivePerms.length})
        </div>
        <div className="flex flex-wrap gap-1">
          {effectivePerms.map((code) => (
            <Badge key={code} variant="outline" className="text-xs font-medium">
              {getPermLabel(code, mockPermissions) || code}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
