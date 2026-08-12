import { PlatformType } from '@skilldna/shared';
import { WebhookRepository } from '../repositories/webhook.repository';
import { verifyWebhookSignature } from '../validators/webhook.validator';
import { InvalidWebhookSignatureError } from '../errors/integration.errors';
import { GitHubService } from './github.service';

export class WebhookService {
  static async processWebhook(
    platform: PlatformType,
    event: string,
    payload: any,
    signature?: string,
    rawBody?: string,
  ) {
    const eventId = payload?.id || payload?.head_commit?.id || `${platform}_${event}_${Date.now()}`;

    const isDuplicate = await WebhookRepository.isDuplicateEvent(String(eventId));
    if (isDuplicate) {
      return {
        status: 'DUPLICATE_SKIPPED',
        eventId,
        message: 'Webhook event was already processed (replay prevented).',
      };
    }

    const webhookSecret = process.env[`WEBHOOK_SECRET_${platform}`] || process.env.WEBHOOK_SECRET;
    if (webhookSecret && signature && rawBody) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        throw new InvalidWebhookSignatureError(platform);
      }
    }

    let processedResult: any = null;

    if (platform === PlatformType.GITHUB) {
      if (event === 'push' && payload.sender?.id) {
        const userId = payload.sender?.login; // or resolved user
        processedResult = await GitHubService.handleWebhookPushEvent(userId, payload);
      }
    }

    await WebhookRepository.markEventProcessed(String(eventId), platform, event);

    return {
      status: 'PROCESSED',
      eventId,
      platform,
      event,
      result: processedResult,
      timestamp: new Date().toISOString(),
    };
  }
}
