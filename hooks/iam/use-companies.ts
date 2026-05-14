import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query"
import { iamService } from "@/services/iam.service"
import { toast } from "react-toastify"
import { parseApiError } from "@/lib/api-error"

/**
 * Hook để lấy danh sách tổ chức/công ty
 */
export function useCompanies(params?: { page?: number; page_size?: number; search?: string }) {
  return useQuery({
    queryKey: ["iam", "companies", params],
    queryFn: () => iamService.getCompanies(params),
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook để lấy danh sách tổ chức/công ty có phân trang (vô hạn)
 */
export function useInfiniteCompanies(params?: { search?: string; page_size?: number }) {
  return useInfiniteQuery({
    queryKey: ["iam", "companies", "infinite", params],
    queryFn: ({ pageParam = 1 }) => 
      iamService.getCompanies({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.meta
      return page < total_pages ? page + 1 : undefined
    },
  })
}

/**
 * Hook để thêm mới công ty
 */
export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => iamService.createCompany(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "companies"] })
      toast.success("Thêm mới tổ chức thành công")
    },
    onError: (error: any) => {
      toast.error(parseApiError(error))
    }
  })
}

/**
 * Hook để cập nhật tên công ty
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      iamService.updateCompany(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "companies"] })
      toast.success("Cập nhật tổ chức thành công")
    },
    onError: (error: any) => {
      toast.error(parseApiError(error))
    }
  })
}

/**
 * Hook để xóa công ty
 */
export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => iamService.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "companies"] })
      queryClient.invalidateQueries({ queryKey: ["iam", "users"] })
      queryClient.invalidateQueries({ queryKey: ["iam", "groups"] })
      toast.success("Xóa tổ chức thành công")
    },
    onError: (error: any) => {
      toast.error(parseApiError(error))
    }
  })
}

/**
 * Hook để lấy danh sách quyền đã gán của một công ty
 */
export function useCompanyPermissions(companyId: number | undefined) {
  return useQuery({
    queryKey: ["iam", "companies", companyId, "permissions"],
    queryFn: () => iamService.getCompanyPermissions(companyId!),
    enabled: !!companyId,
  })
}

/**
 * Hook để gán quyền cho một công ty
 */
export function useAssignCompanyPermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ companyId, perms }: { companyId: number; perms: string[] }) =>
      iamService.assignCompanyPermissions(companyId, perms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iam", "companies"] })
      toast.success("Cập nhật quyền tổ chức thành công")
    },
    onError: (error: any) => {
      toast.error(parseApiError(error))
    }
  })
}
