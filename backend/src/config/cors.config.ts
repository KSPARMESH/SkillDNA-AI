import cors, { CorsOptions } from 'cors';
import { config } from './index';

export const DEFAULT_ALLOWED_ORIGINS: readonly string[] = [
  'https://skill-dna-ai-frontend.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

/**
 * Returns a deduplicated array of all allowed origins including defaults
 * and any explicitly configured environment URLs.
 */
export function getAllowedOrigins(): string[] {
  const origins = new Set<string>(DEFAULT_ALLOWED_ORIGINS);

  if (config.clientUrl) {
    const urls = config.clientUrl
      .split(',')
      .map((u) => u.trim().replace(/\/+$/, ''))
      .filter(Boolean);
    urls.forEach((u) => origins.add(u));
  }

  if (config.corsAllowedOrigins) {
    const customOrigins = config.corsAllowedOrigins
      .split(',')
      .map((u) => u.trim().replace(/\/+$/, ''))
      .filter(Boolean);
    customOrigins.forEach((u) => origins.add(u));
  }

  return Array.from(origins);
}

/**
 * Validates whether an incoming Origin header is permitted.
 * Requests without an Origin header (e.g. server-to-server, curl, healthchecks)
 * are allowed through.
 */
export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;
  const normalizedOrigin = origin.trim().replace(/\/+$/, '');
  const allowed = getAllowedOrigins();
  return allowed.includes(normalizedOrigin);
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

export const corsMiddleware = cors(corsOptions);
