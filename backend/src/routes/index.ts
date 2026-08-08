import { Router } from 'express';
import authRoutes from '../domains/auth/auth.routes';
import userRoutes from '../domains/user/user.routes';
import integrationsRoutes from '../domains/integrations/integrations.routes';
import aiRoutes from '../domains/ai/ai.routes';
import recruitmentRoutes from '../domains/recruitment/recruitment.routes';
import organizationRoutes from '../domains/organization/organization.routes';
import analyticsRoutes from '../domains/analytics/analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/integrations', integrationsRoutes);
router.use('/ai', aiRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/organizations', organizationRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
