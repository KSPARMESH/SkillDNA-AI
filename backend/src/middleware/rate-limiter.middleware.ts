import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { HttpStatusCode, ApiErrorCode } from '@skilldna/shared';
import { config } from '../config';

export interface RateLimiterFactoryOptions {
  windowMs: number;
  max: number;
  message?: string;
  skipFailedRequests?: boolean;
}

/**
 * Standard factory function for creating express-rate-limit instances with unified safe JSON error format.
 */
export function createRateLimiter(options: RateLimiterFactoryOptions): RateLimitRequestHandler {
  const errorMessage = options.message || 'Too many requests. Please try again later.';

  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max,
    standardHeaders: true, // Returns RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset headers
    legacyHeaders: false, // Disable deprecated X-RateLimit-* headers
    statusCode: HttpStatusCode.TOO_MANY_REQUESTS,
    skipFailedRequests: options.skipFailedRequests ?? false,
    handler: (_req: Request, res: Response, _next: NextFunction) => {
      res.status(HttpStatusCode.TOO_MANY_REQUESTS).json({
        success: false,
        statusCode: HttpStatusCode.TOO_MANY_REQUESTS,
        errorCode: ApiErrorCode.RATE_LIMIT_EXCEEDED,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
    validate: {
      trustProxy: false,
      xForwardedForHeader: false,
    },
  });
}

/**
 * General API rate limiter applied to all `/api/v1` routes.
 * Default: 100 requests per 15 minutes.
 */
export const generalRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests across API. Please try again later.',
});

/**
 * Strict rate limiter for `/api/v1/auth/login` to prevent credential stuffing and brute-force attacks.
 * Default: 10 requests per 15 minutes.
 */
export const authLoginRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authLoginMaxRequests,
  message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
});

/**
 * Strict rate limiter for `/api/v1/auth/refresh` to prevent refresh token abuse and rotation attacks.
 * Default: 30 requests per 15 minutes.
 */
export const authRefreshRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authRefreshMaxRequests,
  message: 'Too many token refresh requests. Please try again later.',
});

/**
 * Strict rate limiter for `/api/v1/ai/skill-dna-report` to protect Gemini AI quotas and control infrastructure cost.
 * Default: 10 requests per 15 minutes.
 */
export const aiReportRateLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.aiReportMaxRequests,
  message:
    'AI SkillDNA report generation limit reached. Please wait before generating another report.',
});
