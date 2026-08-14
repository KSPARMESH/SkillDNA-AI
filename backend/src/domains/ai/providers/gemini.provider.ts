import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../../config';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export interface IGeminiProvider {
  generateSkillDnaEvaluation(prompt: string): Promise<{ rawText: string; rawResponse?: any }>;
}

export class GeminiProvider implements IGeminiProvider {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private apiKey: string = config.geminiApiKey) {
    if (this.apiKey && this.apiKey.trim() !== '') {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  async generateSkillDnaEvaluation(
    prompt: string,
  ): Promise<{ rawText: string; rawResponse?: any }> {
    if (!this.isConfigured() || !this.genAI) {
      throw new AppError(
        'Gemini API key is not configured. Please ensure GEMINI_API_KEY is properly set.',
        HttpStatusCode.SERVICE_UNAVAILABLE,
        ApiErrorCode.INTERNAL_ERROR,
      );
    }

    try {
      const modelName = config.geminiModel || 'gemini-1.5-pro';
      const model = this.genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();

      return {
        rawText,
        rawResponse: {
          model: modelName,
          candidatesCount: response.candidates?.length ?? 1,
          finishReason: response.candidates?.[0]?.finishReason,
          usageMetadata: response.usageMetadata,
        },
      };
    } catch (error: any) {
      // Check for rate limit / quota exhaustion
      const errorMessage = String(error?.message || '');
      const isRateLimit =
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('quota');

      if (isRateLimit) {
        throw new AppError(
          'Gemini AI rate limit exceeded or quota exhausted. Please try again later.',
          HttpStatusCode.TOO_MANY_REQUESTS,
          ApiErrorCode.RATE_LIMIT_EXCEEDED,
        );
      }

      // Safe sanitized error message without leaking API keys or internal secrets
      let sanitizedMessage = 'Gemini AI inference service encountered an error.';
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
        sanitizedMessage = 'Invalid Gemini API key provided.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        sanitizedMessage = 'Gemini AI request timed out.';
      }

      throw new AppError(
        sanitizedMessage,
        HttpStatusCode.SERVICE_UNAVAILABLE,
        ApiErrorCode.INTERNAL_ERROR,
      );
    }
  }
}
