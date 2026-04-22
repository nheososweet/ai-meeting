import { useMutation } from "@tanstack/react-query";
import { evaluateTranscript, type EvaluationResponse } from "@/services/pipeline-records.service";

export function useEvaluateTranscriptMutation() {
  return useMutation<
    EvaluationResponse,
    Error,
    {
      id: number;
      transcript: string;
    }
  >({
    mutationFn: evaluateTranscript,
  });
}
