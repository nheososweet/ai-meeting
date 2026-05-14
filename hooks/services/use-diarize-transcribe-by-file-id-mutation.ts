import { useMutation } from "@tanstack/react-query";

import {
  diarizeAndTranscribeByFileId,
  type DiarizeTranscribeResponse,
} from "@/services/pipeline-records.service";

export function useDiarizeTranscribeByFileIdMutation() {
  return useMutation<
    DiarizeTranscribeResponse,
    Error,
    {
      fileId: number;
      language?: string;
    }
  >({
    mutationFn: diarizeAndTranscribeByFileId,
  });
}
