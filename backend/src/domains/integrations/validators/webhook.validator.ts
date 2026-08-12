import crypto from 'crypto';
import { AppError, HttpStatusCode, ApiErrorCode, PlatformType } from '@skilldna/shared';
import { WebhookDto } from '../dto/webhook.dto';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';

export function validateWebhookPayload(data: any): WebhookDto {
  if (!data || typeof data !== 'object') {
    throw new AppError(
      'Invalid webhook request payload.',
      HttpStatusCode.BAD_REQUEST,
      ApiErrorCode.INVALID_INPUT,
    );
  }

  const { platform, event, payload, signature } = data;

  if (!platform || !INTEGRATION_CONSTANTS.SUPPORTED_PLATFORMS.includes(platform as PlatformType)) {
    throw new AppError(
      `Unsupported webhook platform '${platform}'.`,
      HttpStatusCode.BAD_REQUEST,
      ApiErrorCode.INVALID_INPUT,
    );
  }

  if (!event || typeof event !== 'string') {
    throw new AppError(
      'Webhook event type is required.',
      HttpStatusCode.BAD_REQUEST,
      ApiErrorCode.INVALID_INPUT,
    );
  }

  if (!payload || typeof payload !== 'object') {
    throw new AppError(
      'Webhook payload object is required.',
      HttpStatusCode.BAD_REQUEST,
      ApiErrorCode.INVALID_INPUT,
    );
  }

  return {
    platform: platform as PlatformType,
    event,
    payload,
    signature: signature ? String(signature) : undefined,
  };
}

export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string,
  algorithm = 'sha256',
): boolean {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  try {
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(rawBody);
    const computedSignature = `${algorithm}=${hmac.digest('hex')}`;
    const directHexSignature = hmac.digest('hex');

    return (
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature)) ||
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(directHexSignature))
    );
  } catch (error) {
    return false;
  }
}
