export interface ISkillDnaReport {
  id: string;
  userId: string;
  overallScore: number;
  codeQualityScore: number;
  problemSolvingScore: number;
  systemDesignScore: number;
  breadthScore: number;
  consistencyScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendationSummary: string;
  generatedAt: Date | string;
}

export interface ICareerReadiness {
  id: string;
  userId: string;
  targetRole: string;
  readinessScore: number;
  readinessLevel: string;
  skillMatchPercentage: number;
  missingSkills: string[];
  recommendedActions: string[];
}
