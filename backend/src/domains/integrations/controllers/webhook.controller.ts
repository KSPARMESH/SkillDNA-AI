import { Request, Response, NextFunction } from 'express';
import { validateWebhookPayload } from '../validators/webhook.validator';
import { WebhookService } from '../services/webhook.service';
import { PlatformType } from '@skilldna/shared';

export class WebhookController {
  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const platformParam = req.params.platform;
      const payloadPlatform = req.body.platform || platformParam;

      const event = req.headers['x-github-event'] || req.body.event || 'push';
      const signature =
        (req.headers['x-hub-signature-256'] as string) ||
        (req.headers['x-signature'] as string) ||
        req.body.signature;

      const validated = validateWebhookPayload({
        platform: payloadPlatform ? String(payloadPlatform).toUpperCase() : PlatformType.GITHUB,
        event: String(event),
        payload: req.body,
        signature,
      });

      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      const result = await WebhookService.processWebhook(
        validated.platform,
        validated.event,
        validated.payload,
        validated.signature,
        rawBody,
      );

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully.',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
