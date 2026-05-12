import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query"
import { iamService, type CreateRolePayload, type UpdateRolePayload } from "@/services/iam.service"
import { toast } from "react-toastify"
import { parseApiError } from "@/lib/api-error"

/**
 * Hook để lấy danh sách vai trò
 */
export function useRoles(params?: {
  page?: number
  page_size?: number
  search?: string
}) {
  return useQuery({
    queryKey: ["iam", "roles", params],
    queryFn: () => iamService.getRoles(params),
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook để lấy danh sách vai trò dạng vô hạn (Lazy Loading)
 */
export function useInfiniteRoles(params?: { search?: string }) {
  return useInfiniteQuery({
    queryKey: ["iam", "roles", "infinite", params],
    queryFn: ({ pageParam = 1 }) =>
      iamService.getRoles({
        page: pageParam as number,
        page_size: 20,
        search: params?.search,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_next ? lastPage.meta.page + 1 : undefined,
  })
}

/**
 * Hook để tạo mới vai trò
 */
export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => iamService.createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "roles"] })
      toast.success("Tạo vai trò thành công")
    },
    onError: (error: any) => {
      toast.error(parseApiError(error))
    }
  })
}

/**
 * Hook để cập nhật vai trò
 */
export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: number; payload: UpdateRolePayload }) => 
      iamService.updateRole(roleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "roles"] })
      toast.success("Cập nhật vai trò thành công")
    },
    onError: (error: any) => {
      toast.error(parseApiError(error))
    }
  })
}

/**
 * Hook để xóa vai trò
 */
export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roleId: number) => iamService.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "roles"] })
      toast.success("Xóa vai trò thành công")
    },
    onError: (error: any) => {
      toast.error(parseApiError(error))
    }
  })
}

/**
 * Hook để lấy quyền của vai trò
 */
export function useRolePermissions(roleId: number | undefined) {
  return useQuery({
    queryKey: ["iam", "roles", roleId, "permissions"],
    queryFn: () => iamService.getRolePermissions(roleId!),
    enabled: !!roleId,
  })
}

/**
 * Hook để gán quyền cho vai trò
 */
export function useAssignRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, perms }: { roleId: number; perms: string[] }) =>
      iamService.assignRolePermissions(roleId, perms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "roles"] })
      toast.success("Cập nhật quyền cho vai trò thành công")
    },
    onError: (error: any) => {
      toast.error(parseApiError(error))
    }
  })
}
