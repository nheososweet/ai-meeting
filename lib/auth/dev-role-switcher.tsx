"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { ROLE_PRESETS } from "@/lib/auth/permissions"
import { ShieldCheckIcon } from "lucide-react"

/**
 * Dev-only toolbar for switching between mock role presets.
 * Renders a floating pill at the bottom-right of the screen.
 * Only visible in development mode.
 */
export function DevRoleSwitcher() {
  const { currentUser, switchMockRole } = useAuth()

  // Only show in development
  if (process.env.NODE_ENV !== "development") return null

  const currentRoleName = currentUser.roles[0]?.name ?? "—"

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs shadow-lg">
      <ShieldCheckIcon className="size-3.5 text-primary" />
      <span className="font-semibold text-foreground">Role:</span>
      <select
        value={currentRoleName}
        onChange={(e) => switchMockRole(e.target.value)}
        className="rounded border border-border bg-background px-1.5 py-0.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
      >
        {Object.values(ROLE_PRESETS).map((preset) => (
          <option key={preset} value={preset}>
            {preset}
          </option>
        ))}
      </select>
      <span className="text-muted-foreground">
        ({currentUser.effectivePermissions.length} perms)
      </span>
    </div>
  )
}
