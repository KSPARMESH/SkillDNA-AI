import { prisma } from '@skilldna/database';
import { ReportType } from '@prisma/client';
import { config } from '../../config';
import { AiContextBuilder } from './services/ai-context.builder';
import { AiPromptBuilder } from './services/ai-prompt.builder';
import { AiValidatorService } from './services/ai-validator.service';
import { GeminiProvider, IGeminiProvider } from './providers/gemini.provider';

export class AiService {
  private static geminiProviderInstance: IGeminiProvider | null = null;

  private static getGeminiProvider(): IGeminiProvider {
    if (!this.geminiProviderInstance) {
      this.geminiProviderInstance = new GeminiProvider(config.geminiApiKey);
    }
    return this.geminiProviderInstance;
  }

  static setGeminiProvider(provider: IGeminiProvider): void {
    this.geminiProviderInstance = provider;
  }

  static resetGeminiProvider(): void {
    this.geminiProviderInstance = null;
  }

  static async generateSkillDnaReport(userId: string) {
    // 1. Build structured context from actual persisted user data
    const context = await AiContextBuilder.buildUserSkillDnaContext(userId);

    // 2. Build structured scoring prompt with rubric
    const prompt = AiPromptBuilder.buildSkillDnaPrompt(context);

    // 3. Request Gemini AI evaluation
    const provider = this.getGeminiProvider();
    const rawResult = await provider.generateSkillDnaEvaluation(prompt);

    // 4. Robust JSON parsing and field/score validation
    const validatedOutput = AiValidatorService.parseAndValidateAiReportResponse(rawResult.rawText);

    // 5. Persist report to database using Prisma SkillDnaReport model
    const report = await prisma.skillDnaReport.create({
      data: {
        userId,
        reportType: ReportType.SKILLDNA_FULL,
        overallScore: validatedOutput.overallScore,
        codeQualityScore: validatedOutput.codeQualityScore,
        problemSolvingScore: validatedOutput.problemSolvingScore,
        systemDesignScore: validatedOutput.systemDesignScore,
        breadthScore: validatedOutput.breadthScore,
        consistencyScore: validatedOutput.consistencyScore,
        strengths: validatedOutput.strengths,
        weaknesses: validatedOutput.weaknesses,
        recommendationSummary: validatedOutput.recommendationSummary,
        rawAiOutput: {
          model: config.geminiModel || 'gemini-1.5-pro',
          generatedAt: new Date().toISOString(),
          evaluatedContext: {
            totalProjects: context.evidenceSummary.totalProjects,
            totalSkills: context.evidenceSummary.totalSkills,
            totalVerifiedSkills: context.evidenceSummary.totalVerifiedSkills,
            totalCodingProblemsSolved: context.evidenceSummary.totalCodingProblemsSolved,
            totalGithubCommits: context.evidenceSummary.totalGithubCommits,
          },
          aiResponse: validatedOutput.rawAiOutput,
          providerMetadata: rawResult.rawResponse || null,
        },
        generatedAt: new Date(),
      },
    });

    // 6. Update user's profile summary score
    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        totalSkillDnaScore: validatedOutput.overallScore,
      },
      update: {
        totalSkillDnaScore: validatedOutput.overallScore,
      },
    });

    return report;
  }
}
