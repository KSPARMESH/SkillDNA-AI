import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export class IntegrationNotFoundError extends AppError {
  constructor(identifier: string) {
    super(
      `Integration matching '${identifier}' was not found.`,
      HttpStatusCode.NOT_FOUND,
      ApiErrorCode.RESOURCE_NOT_FOUND,
    );
  }
}

export class PlatformNotSupportedError extends AppError {
  constructor(platform: string) {
    super(
      `Platform '${platform}' is not supported by SkillDNA AI.`,
      HttpStatusCode.BAD_REQUEST,
      ApiErrorCode.INVALID_INPUT,
    );
  }
}

export class OAuthAuthenticationError extends AppError {
  constructor(details: string) {
    super(
      `OAuth authentication failed: ${details}`,
      HttpStatusCode.UNAUTHORIZED,
      ApiErrorCode.AUTHENTICATION_FAILED,
    );
  }
}

export class RateLimitExceededError extends AppError {
  readonly retryAfterSeconds?: number;
  readonly resetAt?: Date;

  constructor(platform: string, retryAfterSeconds?: number, resetAt?: Date) {
    const formattedReset = resetAt
      ? ` Reset at ${resetAt.toISOString()}.`
      : retryAfterSeconds
        ? ` Please retry after ${retryAfterSeconds} seconds.`
        : '';
    super(
      `Rate limit exceeded for platform '${platform}'.${formattedReset}`,
      HttpStatusCode.TOO_MANY_REQUESTS,
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
    );
    this.retryAfterSeconds = retryAfterSeconds;
    this.resetAt = resetAt;
  }
}

export class SyncFailedError extends AppError {
  constructor(platform: string, reason: string) {
    super(
      `Synchronization failed for platform '${platform}': ${reason}`,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      ApiErrorCode.INTERNAL_ERROR,
    );
  }
}

export class InvalidWebhookSignatureError extends AppError {
  constructor(platform: string) {
    super(
      `Invalid webhook signature for platform '${platform}'.`,
      HttpStatusCode.UNAUTHORIZED,
      ApiErrorCode.AUTHENTICATION_FAILED,
    );
  }
}

export class PlatformLimitationError extends AppError {
  constructor(platform: string, limitationMessage: string) {
    super(
      `Platform '${platform}' limitation: ${limitationMessage}`,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      ApiErrorCode.INVALID_INPUT,
    );
  }
}
