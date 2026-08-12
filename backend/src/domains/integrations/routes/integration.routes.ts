import { Router } from 'express';
import { IntegrationController } from '../controllers/integration.controller';
import { authenticate } from '../../../middleware/auth.middleware';
import githubRoutes from './github.routes';
import syncRoutes from './sync.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

// Public platform metadata endpoint
router.get('/platforms', IntegrationController.getSupportedPlatforms);

// Authenticated integration routes
router.post('/connect', authenticate, IntegrationController.connect);
router.post('/disconnect', authenticate, IntegrationController.disconnect);
router.get('/', authenticate, IntegrationController.listIntegrations);
router.get('/status', authenticate, IntegrationController.getIntegrationStatus);

// Mount platform specific and sync/webhook sub-routes
router.use('/github', githubRoutes);
router.use('/sync', syncRoutes);
router.use('/webhook', webhookRoutes);

export default router;
