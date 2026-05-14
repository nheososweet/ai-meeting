import { useMutation, useQuery, useQueryClient, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { filesService } from "@/services/files.service";
import { type FilesQueryParams } from "@/lib/types/files";

/**
 * Hook to fetch files list
 */
export function useFilesQuery(params?: FilesQueryParams) {
  return useQuery({
    queryKey: ["files", params],
    queryFn: () => filesService.getFiles(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook for infinite files list (lazy loading)
 */
export function useFilesInfiniteQuery(params?: Omit<FilesQueryParams, "page">) {
  return useInfiniteQuery({
    queryKey: ["files-infinite", params],
    queryFn: ({ pageParam = 1 }) => 
      filesService.getFiles({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.meta;
      return page < total_pages ? page + 1 : undefined;
    },
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
