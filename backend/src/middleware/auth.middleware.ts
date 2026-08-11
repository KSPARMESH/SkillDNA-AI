import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export interface JwtUserPayload {
  id: string;
  email: string;
  role: string;
}

export type AuthenticatedRequest = Request;

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(
      new AppError(
        'Authentication required. Authorization header is missing.',
        HttpStatusCode.UNAUTHORIZED,
        ApiErrorCode.AUTHENTICATION_FAILED,
      ),
    );
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1].trim()) {
    return next(
      new AppError(
        'Authentication failed. Invalid Authorization header format. Expected "Bearer <token>".',
        HttpStatusCode.UNAUTHORIZED,
        ApiErrorCode.AUTHENTICATION_FAILED,
      ),
    );
  }

  const token = parts[1].trim();

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;

    if (!decoded || typeof decoded !== 'object' || !decoded.id || !decoded.email || !decoded.role) {
      return next(
        new AppError(
          'Authentication failed. Invalid token payload.',
          HttpStatusCode.UNAUTHORIZED,
          ApiErrorCode.AUTHENTICATION_FAILED,
        ),
      );
    }

    req.user = {
      id: String(decoded.id),
      email: String(decoded.email),
      role: String(decoded.role),
    };

    return next();
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(
        new AppError(
          'Authentication failed. Access token has expired.',
          HttpStatusCode.UNAUTHORIZED,
          ApiErrorCode.TOKEN_EXPIRED,
        ),
      );
    }

    return next(
      new AppError(
        'Authentication failed. Invalid access token.',
        HttpStatusCode.UNAUTHORIZED,
        ApiErrorCode.AUTHENTICATION_FAILED,
      ),
    );
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          'Permission denied. Insufficient role permissions.',
          HttpStatusCode.FORBIDDEN,
          ApiErrorCode.PERMISSION_DENIED,
        ),
      );
    }
    return next();
  };
}
