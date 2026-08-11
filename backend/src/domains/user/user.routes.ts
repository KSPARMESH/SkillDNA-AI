import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/me', authenticate, UserController.getProfile);
router.put('/me', authenticate, UserController.updateProfile);
router.get('/:id', authenticate, UserController.getUserById);

export default router;
