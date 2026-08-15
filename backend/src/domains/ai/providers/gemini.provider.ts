import { GoogleGenAI } from '@google/genai';
import { config } from '../../../config';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export interface IGeminiProvider {
  generateSkillDnaEvaluation(prompt: string): Promise<{ rawText: string; rawResponse?: any }>;
}

export class GeminiProvider implements IGeminiProvider {
  private genAI: GoogleGenAI | null = null;

  constructor(private apiKey: string = config.geminiApiKey) {
    if (this.apiKey && this.apiKey.trim() !== '') {
      this.genAI = new GoogleGenAI({
        apiKey: this.apiKey,
        apiVersion: 'v1',
      });
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

    const modelName = config.geminiModel || 'gemini-3.7-flash';

    try {
      const response = await this.genAI.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const rawText =
        (typeof response.text === 'function' ? (response as any).text() : response.text) || '';

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
      const errorMessage = String(error?.message || '');
      const errorStatus =
        error?.status ||
        error?.statusCode ||
        (errorMessage.match(/\[(\d{3})\s*[^\]]*\]/)?.[1]
          ? parseInt(errorMessage.match(/\[(\d{3})\s*[^\]]*\]/)![1], 10)
          : undefined);
      const errorType = error?.name || error?.constructor?.name || 'UnknownGeminiError';

      // Sanitize any potential API keys/tokens from error message before logging
      const sanitizedErrorMessage = errorMessage
        .replace(/key=[A-Za-z0-9_-]+/gi, 'key=[REDACTED]')
        .replace(/AIzaSy[A-Za-z0-9_-]{33}/gi, '[REDACTED_API_KEY]')
        .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]');

      // Diagnostic logging (safe metadata only - NEVER logs keys, tokens, or prompt data)
      console.error(
        '[GeminiProvider Diagnostic]',
        JSON.stringify({
          model: modelName,
          isApiKeyConfigured: this.isConfigured(),
          statusCode: errorStatus || null,
          errorType,
          providerErrorMessage: sanitizedErrorMessage,
        }),
      );

      // Check for rate limit / quota exhaustion
      const isRateLimit =
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('quota') ||
        errorStatus === 429;

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
