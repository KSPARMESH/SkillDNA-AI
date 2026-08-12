import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller';
import { authenticate } from '../../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, SyncController.sync);
router.post('/:platform', authenticate, SyncController.sync);
router.get('/history', authenticate, SyncController.getHistory);

export default router;
