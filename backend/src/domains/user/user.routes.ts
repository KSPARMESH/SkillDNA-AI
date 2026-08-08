import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/me', authenticate, UserController.getProfile);

export default router;
