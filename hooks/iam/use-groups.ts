import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { iamService } from "@/services/iam.service"
import type { Group, PaginatedResponse } from "@/lib/types/iam"
import { toast } from "react-toastify"
import { parseApiError } from "@/lib/api-error"

/**
 * Hook để lấy danh sách phòng ban/nhóm của một công ty
 */
export function useGroups(companyId: number | null, params?: { page?: number; search?: string }) {
  return useQuery({
    queryKey: ["iam", "groups", companyId, params],
    queryFn: () => iamService.getGroups(companyId!, params),
    enabled: !!companyId, // Chỉ chạy khi đã chọn một công ty
  })
}

/**
 * Hook để lấy danh sách phòng ban/nhóm của một công ty có phân trang (vô hạn)
 */
export function useInfiniteGroups(companyId: number | null, params?: { search?: string; page_size?: number }) {
  return useInfiniteQuery({
    queryKey: ["iam", "groups", "infinite", companyId, params],
    queryFn: ({ pageParam = 1 }) => 
      iamService.getGroups(companyId!, { ...params, page: pageParam as number }),
    initialPageParam: 1,
    enabled: !!companyId,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.meta
      return page < total_pages ? page + 1 : undefined
    },
  })
}

/**
 * Hook để thêm mới phòng ban/nhóm
 */
export function useCreateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ companyId, name, parentId }: { companyId: number; name: string; parentId?: number | null }) =>
      iamService.createGroup(companyId, name, parentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["iam", "groups", variables.companyId] })
      toast.success("Thêm mới nhóm thành công")
    },
    onError: (error: any) => {
      toast.error(parseApiError(error))
    }
  })
}

/**
 * Hook để cập nhật tên nhóm
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => 
      iamService.updateGroup(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "groups"] })
      toast.success("Cập nhật tên nhóm thành công")
    },
    onError: (error: any) => {
      toast.error(parseApiError(error))
    }
  })
}

/**
 * Hook để xóa một phòng ban/nhóm (kèm toàn bộ nhóm con và thành viên)
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: number; name: string }) =>
      iamService.deleteGroup(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["iam", "groups"] })
      toast.success(`Xóa nhóm "${variables.name}" thành công`)
    },
    onError: (error: any) => {
      toast.error(parseApiError(error))
    },
  })
}

/**
 * Hook để lấy danh sách quyền đã gán của một phòng ban/nhóm
 */
export function useGroupPermissions(groupId: number | undefined) {
  return useQuery({
    queryKey: ["iam", "groups", groupId, "permissions"],
    queryFn: () => iamService.getGroupPermissions(groupId!),
    enabled: !!groupId,
  })
}

/**
 * Hook để gán quyền cho một phòng ban/nhóm
 */
export function useAssignGroupPermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, perms }: { groupId: number; perms: string[] }) =>
      iamService.assignGroupPermissions(groupId, perms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "groups"] })
      toast.success("Cập nhật quyền nhóm thành công")
    },
    onError: (error: any) => {
      toast.error(parseApiError(error))
    }
  })
}
