import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCriteria, type EvaluationCriteriaResponse } from "@/services/pipeline-records.service";

export function useUpdateCriteriaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EvaluationCriteriaResponse) => updateCriteria(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria"] });
    },
  });
}
