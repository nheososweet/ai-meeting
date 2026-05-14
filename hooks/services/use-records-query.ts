import { useQuery, keepPreviousData } from "@tanstack/react-query";

import {
  getRecords,
  type PipelineRecord,
} from "@/services/pipeline-records.service";
import { type PaginatedResponse } from "@/lib/types/iam";

export function useRecordsQuery(params?: { page?: number; size?: number }) {
  return useQuery<PaginatedResponse<PipelineRecord>, Error>({
    queryKey: ["records", params],
    queryFn: () => getRecords(params),
    placeholderData: keepPreviousData,
  });
}
