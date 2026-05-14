import { useQuery } from "@tanstack/react-query"
import { iamService } from "@/services/iam.service"

/**
 * Hook để lấy danh sách tất cả các quyền (Permissions) trên hệ thống
 */
export function usePermissions({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["iam", "permissions"],
    queryFn: iamService.getPermissions,
    enabled,
    // Permissions thường hiếm khi thay đổi, có thể cache lâu hơn
    staleTime: 5 * 60 * 1000,
  })
}
