import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import {
  authLoginRateLimiter,
  authRefreshRateLimiter,
} from '../../middleware/rate-limiter.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', authLoginRateLimiter, AuthController.login);
router.post('/refresh', authRefreshRateLimiter, AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);

export default router;
