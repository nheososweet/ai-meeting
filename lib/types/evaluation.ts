export interface EvaluationHighlight {
  id: string;
  segmentText: string;
  speaker: string;
  score: number;
  reason: string;
  startSecond?: number;
  endSecond?: number;
}

export interface RecordEvaluation {
  overallScore: number;
  overallComment: string;
  highlights: EvaluationHighlight[];
}
