import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config';

export class AiService {
  private static genAI = new GoogleGenerativeAI(config.geminiApiKey || 'mock_key');

  static async generateSkillDnaReport(userId: string) {
    return {
      userId,
      overallScore: 88.5,
      codeQualityScore: 91.0,
      problemSolvingScore: 86.0,
      systemDesignScore: 89.0,
      breadthScore: 85.0,
      consistencyScore: 92.0,
      strengths: ['Strict TypeScript Architecture', 'Clean Monorepo Modularization', 'Comprehensive Documentation'],
      weaknesses: ['Advanced Kubernetes Orchestration', 'GraphQL Query Optimization'],
      recommendationSummary: 'Candidate exhibits top 5% architectural maturity for 2 years of experience.',
      generatedAt: new Date().toISOString(),
    };
  }
}
