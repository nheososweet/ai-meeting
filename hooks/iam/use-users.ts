import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { iamService, type CreateUserPayload } from "@/services/iam.service"
import { toast } from "react-toastify"

/**
 * Hook để lấy danh sách tất cả người dùng
 */
export function useUsers(params?: {
  page?: number
  search?: string
  search_companyid?: number
  search_groupid?: number
}) {
  return useQuery({
    queryKey: ["iam", "users", params],
    queryFn: () => iamService.getUsers(params),
  })
}

/**
 * Hook để tạo mới người dùng
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => iamService.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "users"] })
      toast.success("Tạo tài khoản người dùng thành công")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi khi tạo tài khoản")
    }
  })
}

/**
 * Hook để cập nhật thông tin người dùng
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: any }) => 
      iamService.updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "users"] })
      toast.success("Cập nhật thông tin người dùng thành công")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi khi cập nhật thông tin")
    }
  })
}

/**
 * Hook để xóa người dùng
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) => iamService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "users"] })
      toast.success("Xóa người dùng thành công")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi khi xóa người dùng")
    }
  })
}

/**
 * Hook để lấy danh sách quyền đã gán của người dùng
 */
export function useUserPermissions(userId: number | undefined) {
  return useQuery({
    queryKey: ["iam", "users", userId, "permissions"],
    queryFn: () => iamService.getUserPermissions(userId!),
    enabled: !!userId,
  })
}

/**
 * Hook để gán quyền cấp cá nhân cho người dùng
 */
export function useAssignUserPermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, perms }: { userId: number; perms: string[] }) =>
      iamService.assignUserPermissions(userId, perms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "users"] })
      toast.success("Cập nhật quyền người dùng thành công")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi khi cập nhật quyền")
    }
  })
}
