import { useQuery } from "@tanstack/react-query";
import { getCriteria, type EvaluationCriteriaResponse } from "@/services/pipeline-records.service";

export function useCriteriaQuery() {
  return useQuery<EvaluationCriteriaResponse, Error>({
    queryKey: ["evaluation-criteria"],
    queryFn: getCriteria,
  });
}
