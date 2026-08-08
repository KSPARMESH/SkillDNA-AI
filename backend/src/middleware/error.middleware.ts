import { Request, Response, NextFunction } from 'express';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Backend Error Handler]', err);

  const statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
  const errorCode = err.errorCode || ApiErrorCode.INTERNAL_ERROR;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    statusCode,
    errorCode,
    message,
    errors: err.errors || undefined,
    timestamp: new Date().toISOString(),
  });
}
