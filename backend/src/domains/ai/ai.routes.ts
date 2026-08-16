import { Router } from 'express';
import { AiController } from './ai.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { aiReportRateLimiter } from '../../middleware/rate-limiter.middleware';

const router = Router();

router.get('/skill-dna-report', authenticate, AiController.getLatestReport);
router.post('/skill-dna-report', authenticate, aiReportRateLimiter, AiController.generateReport);

export default router;
