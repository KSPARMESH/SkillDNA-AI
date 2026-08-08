import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '@skilldna/shared';
import { HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing Bearer token.', HttpStatusCode.UNAUTHORIZED, ApiErrorCode.AUTHENTICATION_FAILED));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired access token.', HttpStatusCode.UNAUTHORIZED, ApiErrorCode.TOKEN_EXPIRED));
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Permission denied. Insufficient role permissions.', HttpStatusCode.FORBIDDEN, ApiErrorCode.PERMISSION_DENIED));
    }
    next();
  };
}
