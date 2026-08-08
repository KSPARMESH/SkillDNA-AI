import { WEIGHT_CODE_QUALITY, WEIGHT_PROBLEM_SOLVING, WEIGHT_SYSTEM_DESIGN, WEIGHT_BREADTH, WEIGHT_CONSISTENCY } from '../constants/score.constants';

export function calculateSkillDnaScore(metrics: {
  codeQuality: number;
  problemSolving: number;
  systemDesign: number;
  breadth: number;
  consistency: number;
}): number {
  const score =
    metrics.codeQuality * WEIGHT_CODE_QUALITY +
    metrics.problemSolving * WEIGHT_PROBLEM_SOLVING +
    metrics.systemDesign * WEIGHT_SYSTEM_DESIGN +
    metrics.breadth * WEIGHT_BREADTH +
    metrics.consistency * WEIGHT_CONSISTENCY;

  return Math.round(score * 10) / 10;
}
