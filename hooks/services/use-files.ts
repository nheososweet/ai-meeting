import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { filesService } from "@/services/files.service";
import { type FilesQueryParams } from "@/lib/types/files";

/**
 * Hook to fetch files list
 */
export function useFilesQuery(params?: FilesQueryParams) {
  return useQuery({
    queryKey: ["files", params],
    queryFn: () => filesService.getFiles(params),
  });
}

/**
 * Hook to upload a file
 */
export function useUploadFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, title }: { file: File; title: string }) =>
      filesService.uploadFile(file, title),
    onSuccess: () => {
      // Invalidate and refetch files list
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}
