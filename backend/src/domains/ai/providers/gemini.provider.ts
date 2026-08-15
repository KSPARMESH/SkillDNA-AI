import { GoogleGenAI } from '@google/genai';
import { config } from '../../../config';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export interface IGeminiProvider {
  generateSkillDnaEvaluation(prompt: string): Promise<{ rawText: string; rawResponse?: any }>;
}

export interface IGeminiProviderOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  jitterMs?: number;
  sleepFn?: (ms: number) => Promise<void>;
}

export class GeminiProvider implements IGeminiProvider {
  private genAI: GoogleGenAI | null = null;
  private maxAttempts: number = 3;
  private baseDelayMs: number = 1000;
  private jitterMs: number = 250;
  private sleepFn: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  constructor(
    private apiKey: string = config.geminiApiKey,
    options?: IGeminiProviderOptions,
  ) {
    if (this.apiKey && this.apiKey.trim() !== '') {
      this.genAI = new GoogleGenAI({
        apiKey: this.apiKey,
        apiVersion: 'v1',
      });
    }

    if (options?.maxAttempts !== undefined) this.maxAttempts = options.maxAttempts;
    if (options?.baseDelayMs !== undefined) this.baseDelayMs = options.baseDelayMs;
    if (options?.jitterMs !== undefined) this.jitterMs = options.jitterMs;
    if (options?.sleepFn !== undefined) this.sleepFn = options.sleepFn;
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  setSleepFn(fn: (ms: number) => Promise<void>): void {
    this.sleepFn = fn;
  }

  getMaxAttempts(): number {
    return this.maxAttempts;
  }

  getBaseDelayMs(): number {
    return this.baseDelayMs;
  }

  private isTransientError(error: any, errorStatus?: number): boolean {
    const errorMessage = String(error?.message || '');

    // Explicit non-retryable HTTP status codes
    if (errorStatus === 400 || errorStatus === 401 || errorStatus === 403 || errorStatus === 404) {
      return false;
    }

    // Explicit non-retryable message patterns
    if (
      errorMessage.includes('API_KEY_INVALID') ||
      errorMessage.includes('API key not valid') ||
      errorMessage.includes('400 Bad Request') ||
      errorMessage.includes('401 Unauthorized') ||
      errorMessage.includes('403 Forbidden') ||
      errorMessage.includes('404 Not Found') ||
      errorMessage.includes('is not found')
    ) {
      return false;
    }

    // Retryable HTTP status codes
    if (
      errorStatus === 429 ||
      errorStatus === 408 ||
      errorStatus === 500 ||
      errorStatus === 502 ||
      errorStatus === 503 ||
      errorStatus === 504 ||
      (errorStatus !== undefined && errorStatus >= 500 && errorStatus < 600)
    ) {
      return true;
    }

    // Retryable message patterns (including Google GenAI demand spikes)
    if (
      errorMessage.includes('503') ||
      errorMessage.includes('UNAVAILABLE') ||
      errorMessage.includes('high demand') ||
      errorMessage.includes('429') ||
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('408') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('500 Internal Server Error') ||
      errorMessage.includes('502 Bad Gateway') ||
      errorMessage.includes('504 Gateway Timeout') ||
      errorMessage.includes('Backend failure')
    ) {
      return true;
    }

    return false;
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
    let lastError: any = null;
    let lastErrorStatus: number | undefined = undefined;
    let lastSanitizedErrorMessage = '';
    let lastErrorType = '';

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
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
        lastError = error;
        const errorMessage = String(error?.message || '');
        const errorStatus =
          error?.status ||
          error?.statusCode ||
          (errorMessage.match(/\[(\d{3})\s*[^\]]*\]/)?.[1]
            ? parseInt(errorMessage.match(/\[(\d{3})\s*[^\]]*\]/)![1], 10)
            : undefined);

        lastErrorStatus = errorStatus;
        lastErrorType = error?.name || error?.constructor?.name || 'UnknownGeminiError';

        // Sanitize any potential API keys/tokens from error message
        lastSanitizedErrorMessage = errorMessage
          .replace(/key=[A-Za-z0-9_-]+/gi, 'key=[REDACTED]')
          .replace(/AIzaSy[A-Za-z0-9_-]{33}/gi, '[REDACTED_API_KEY]')
          .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]');

        const transient = this.isTransientError(error, errorStatus);

        // If non-retryable error, or if maximum attempts reached, break
        if (!transient || attempt >= this.maxAttempts) {
          break;
        }

        // Bounded exponential backoff delay with random jitter
        const backoffDelay =
          this.baseDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * this.jitterMs);

        await this.sleepFn(backoffDelay);
      }
    }

    // Diagnostic logging (safe metadata only - NEVER logs keys, tokens, or prompt data)
    console.error(
      '[GeminiProvider Diagnostic]',
      JSON.stringify({
        model: modelName,
        isApiKeyConfigured: this.isConfigured(),
        statusCode: lastErrorStatus || null,
        errorType: lastErrorType,
        providerErrorMessage: lastSanitizedErrorMessage,
      }),
    );

    // Check for rate limit / quota exhaustion
    const isRateLimit =
      lastSanitizedErrorMessage.includes('429') ||
      lastSanitizedErrorMessage.includes('RESOURCE_EXHAUSTED') ||
      lastSanitizedErrorMessage.includes('quota') ||
      lastErrorStatus === 429;

    if (isRateLimit) {
      throw new AppError(
        'Gemini AI rate limit exceeded or quota exhausted. Please try again later.',
        HttpStatusCode.TOO_MANY_REQUESTS,
        ApiErrorCode.RATE_LIMIT_EXCEEDED,
      );
    }

    // Safe sanitized error message without leaking API keys or internal secrets
    let sanitizedMessage = 'Gemini AI inference service encountered an error.';
    if (
      lastSanitizedErrorMessage.includes('API_KEY_INVALID') ||
      lastSanitizedErrorMessage.includes('API key not valid')
    ) {
      sanitizedMessage = 'Invalid Gemini API key provided.';
    } else if (
      lastSanitizedErrorMessage.includes('timeout') ||
      lastSanitizedErrorMessage.includes('ETIMEDOUT')
    ) {
      sanitizedMessage = 'Gemini AI request timed out.';
    }

    throw new AppError(
      sanitizedMessage,
      HttpStatusCode.SERVICE_UNAVAILABLE,
      ApiErrorCode.INTERNAL_ERROR,
    );
  }
}
