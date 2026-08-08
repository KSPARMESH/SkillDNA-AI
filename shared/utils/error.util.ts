import { HttpStatusCode, ApiErrorCode } from '../enums/api.enum';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    public errorCode: ApiErrorCode = ApiErrorCode.INTERNAL_ERROR,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: Array<{ field: string; message: string }>) {
    super(message, HttpStatusCode.BAD_REQUEST, ApiErrorCode.INVALID_INPUT, errors);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super(message, HttpStatusCode.UNAUTHORIZED, ApiErrorCode.AUTHENTICATION_FAILED);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied.') {
    super(message, HttpStatusCode.FORBIDDEN, ApiErrorCode.PERMISSION_DENIED);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(message, HttpStatusCode.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND);
    this.name = 'NotFoundError';
  }
}
