import { useMutation, useQueryClient } from "@tanstack/react-query"
import { iamService, type AssignFilePayload } from "@/services/iam.service"
import { toast } from "react-toastify"
import { parseApiError } from "@/lib/api-error"

export function useAssignFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId, payload }: { fileId: number, payload: AssignFilePayload }) => 
      iamService.assignFile(fileId, payload),
    onSuccess: () => {
      toast.success("Phân phối hồ sơ thành công")
      queryClient.invalidateQueries({ queryKey: ["files"] })
    },
    onError: (error: any) => {
      toast.error(parseApiError(error))
    }
  })
}
