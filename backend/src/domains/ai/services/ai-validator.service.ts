import { AppError, HttpStatusCode, ApiErrorCode, calculateSkillDnaScore } from '@skilldna/shared';
import { GeminiSkillDnaReportOutput } from '../types/ai.types';

export class AiValidatorService {
  private static validateScore(val: any, fieldName: string): number {
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      throw new AppError(
        `Invalid AI score generated for '${fieldName}': expected numeric value, received ${typeof val} (${val}).`,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ApiErrorCode.INTERNAL_ERROR,
      );
    }

    if (val < 0.0 || val > 100.0) {
      throw new AppError(
        `Score out of range for '${fieldName}': must be between 0.0 and 100.0, received ${val}.`,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ApiErrorCode.INTERNAL_ERROR,
      );
    }

    return Math.round(val * 10) / 10;
  }

  static parseAndValidateAiReportResponse(rawResponseText: string): GeminiSkillDnaReportOutput {
    if (!rawResponseText || typeof rawResponseText !== 'string' || !rawResponseText.trim()) {
      throw new AppError(
        'Empty response received from Gemini AI model.',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ApiErrorCode.INTERNAL_ERROR,
      );
    }

    let cleaned = rawResponseText.trim();

    // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = cleaned.match(jsonBlockRegex);
    if (match && match[1]) {
      cleaned = match[1].trim();
    } else {
      // If starts with ``` and ends with ```
      if (cleaned.startsWith('```')) {
        cleaned = cleaned
          .replace(/^```(?:json)?/, '')
          .replace(/```$/, '')
          .trim();
      }
    }

    // Extract first { to last } if extraneous characters surround it
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError: any) {
      throw new AppError(
        `Failed to parse Gemini AI response as valid JSON: ${parseError?.message || 'Invalid format'}.`,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ApiErrorCode.INTERNAL_ERROR,
      );
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new AppError(
        'Gemini AI response root must be a JSON object.',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ApiErrorCode.INTERNAL_ERROR,
      );
    }

    // Validate Sub-Scores
    const codeQualityScore = this.validateScore(parsed.codeQualityScore, 'codeQualityScore');
    const problemSolvingScore = this.validateScore(
      parsed.problemSolvingScore,
      'problemSolvingScore',
    );
    const systemDesignScore = this.validateScore(parsed.systemDesignScore, 'systemDesignScore');
    const breadthScore = this.validateScore(parsed.breadthScore, 'breadthScore');
    const consistencyScore = this.validateScore(parsed.consistencyScore, 'consistencyScore');

    // Overall Score (Validate provided score, or fallback to deterministic formula)
    let overallScore: number;
    if (parsed.overallScore !== undefined && parsed.overallScore !== null) {
      overallScore = this.validateScore(parsed.overallScore, 'overallScore');
    } else {
      overallScore = calculateSkillDnaScore({
        codeQuality: codeQualityScore,
        problemSolving: problemSolvingScore,
        systemDesign: systemDesignScore,
        breadth: breadthScore,
        consistency: consistencyScore,
      });
    }

    // Validate Strengths
    if (!Array.isArray(parsed.strengths) || parsed.strengths.length === 0) {
      throw new AppError(
        "Invalid AI output: 'strengths' must be a non-empty array of strings.",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ApiErrorCode.INTERNAL_ERROR,
      );
    }

    const strengths = parsed.strengths
      .map((s: any) => (typeof s === 'string' ? s.trim() : ''))
      .filter((s: string) => s.length > 0);

    if (strengths.length === 0) {
      throw new AppError(
        "Invalid AI output: 'strengths' contains no valid non-empty string entries.",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ApiErrorCode.INTERNAL_ERROR,
      );
    }

    // Validate Weaknesses
    if (!Array.isArray(parsed.weaknesses) || parsed.weaknesses.length === 0) {
      throw new AppError(
        "Invalid AI output: 'weaknesses' must be a non-empty array of strings.",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ApiErrorCode.INTERNAL_ERROR,
      );
    }

    const weaknesses = parsed.weaknesses
      .map((w: any) => (typeof w === 'string' ? w.trim() : ''))
      .filter((w: string) => w.length > 0);

    if (weaknesses.length === 0) {
      throw new AppError(
        "Invalid AI output: 'weaknesses' contains no valid non-empty string entries.",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ApiErrorCode.INTERNAL_ERROR,
      );
    }

    // Validate Recommendation Summary
    if (
      !parsed.recommendationSummary ||
      typeof parsed.recommendationSummary !== 'string' ||
      !parsed.recommendationSummary.trim()
    ) {
      throw new AppError(
        "Invalid AI output: 'recommendationSummary' must be a non-empty string.",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ApiErrorCode.INTERNAL_ERROR,
      );
    }

    const recommendationSummary = parsed.recommendationSummary.trim();

    return {
      overallScore,
      codeQualityScore,
      problemSolvingScore,
      systemDesignScore,
      breadthScore,
      consistencyScore,
      strengths,
      weaknesses,
      recommendationSummary,
      rawAiOutput: parsed,
    };
  }
}
