import { useQuery } from "@tanstack/react-query"
import { filesService } from "@/services/files.service"

export function useFileHistory(fileId: number | null) {
  return useQuery({
    queryKey: ["file-history", fileId],
    queryFn: () => filesService.getFileHistory(fileId!),
    enabled: fileId !== null,
  })
}
