import { Router } from 'express';
import { AiController } from './ai.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/skill-dna-report', authenticate, AiController.getLatestReport);
router.post('/skill-dna-report', authenticate, AiController.generateReport);

export default router;
