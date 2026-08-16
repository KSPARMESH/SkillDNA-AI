import dotenv from 'dotenv';
import { parseAndValidateKey } from '../utils/crypto.util';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

// Fail startup explicitly if ENCRYPTION_KEY is missing in production
if (isProduction && (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.trim() === '')) {
  throw new Error(
    'CRITICAL CONFIGURATION ERROR: ENCRYPTION_KEY environment variable is missing in production. Application startup aborted.',
  );
}

// If ENCRYPTION_KEY is provided, validate length and format strictly
if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.trim() !== '') {
  parseAndValidateKey(process.env.ENCRYPTION_KEY, isProduction);
}

/**
 * Parses duration strings like '15m', '1h', '60s', or milliseconds into numeric milliseconds.
 */
export function parseDurationMs(duration: string | number | undefined, defaultMs: number): number {
  if (typeof duration === 'number') return duration;
  if (!duration || typeof duration !== 'string') return defaultMs;

  const trimmed = duration.trim();
  const match = trimmed.match(/^(\d+)(ms|s|m|h|d)?$/i);
  if (!match) {
    const parsed = parseInt(trimmed, 10);
    return isNaN(parsed) ? defaultMs : parsed;
  }

  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'ms').toLowerCase();

  switch (unit) {
    case 'ms':
      return value;
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return defaultMs;
  }
}

export const config = {
  env,
  port: parseInt(process.env.PORT || process.env.SERVER_PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  jwtSecret: process.env.JWT_SECRET || 'skilldna_jwt_secret_development_min_32_chars',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'skilldna_jwt_refresh_secret_min_32_chars',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS || '',
  rateLimit: {
    windowMs: parseDurationMs(process.env.RATE_LIMIT_WINDOW, 15 * 60 * 1000),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    authLoginMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10', 10),
    authRefreshMaxRequests: parseInt(process.env.REFRESH_RATE_LIMIT_MAX_REQUESTS || '30', 10),
    aiReportMaxRequests: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS || '10', 10),
  },
};
