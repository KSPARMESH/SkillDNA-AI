import { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiterMiddleware(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || '127.0.0.1';
    const now = Date.now();
    const record = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count++;
    requestCounts.set(ip, record);

    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: { code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded. Please try again later.' },
      });
    }

    next();
  };
}
