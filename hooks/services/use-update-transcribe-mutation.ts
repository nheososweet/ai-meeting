import { useMutation } from "@tanstack/react-query";

import {
  updateTranscribe,
  type UpdateTranscribeResponse,
} from "@/services/pipeline-records.service";

export function useUpdateTranscribeMutation() {
  return useMutation<
    UpdateTranscribeResponse,
    Error,
    {
      id: number;
      textContent: string;
    }
  >({
    mutationFn: updateTranscribe,
  });
}
