import { useMutation } from "@tanstack/react-query";
import { processAndSaveCRM, type CRMResponse } from "@/services/pipeline-records.service";

export function useProcessSaveCRMMutation() {
  return useMutation<
    CRMResponse,
    Error,
    {
      id: number;
      transcript: string;
    }
  >({
    mutationFn: processAndSaveCRM,
  });
}
