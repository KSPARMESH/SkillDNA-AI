import { Router } from 'express';
import { IntegrationsController } from './integrations.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/sync/:platform', authenticate, IntegrationsController.sync);

export default router;
