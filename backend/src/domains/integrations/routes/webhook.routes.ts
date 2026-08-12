import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

router.post('/', WebhookController.handleWebhook);
router.post('/:platform', WebhookController.handleWebhook);

export default router;
