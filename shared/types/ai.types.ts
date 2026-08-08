export interface AiPromptInput {
  userId: string;
  promptType: string;
  contextData: Record<string, any>;
}

export interface AiReportPayload {
  overallScore: number;
  codeQualityScore: number;
  problemSolvingScore: number;
  systemDesignScore: number;
  breadthScore: number;
  consistencyScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendationSummary: string;
}
