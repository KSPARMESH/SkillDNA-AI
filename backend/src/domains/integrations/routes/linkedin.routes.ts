import { Router } from 'express';
import { LinkedInController } from '../controllers/linkedin.controller';
import { authenticate } from '../../../middleware/auth.middleware';

const router = Router();

// Authenticated route to generate user-bound signed OAuth authorization URL
router.get('/oauth/url', authenticate, LinkedInController.getOAuthUrl);

// Public browser callback endpoint reached from LinkedIn authorization redirect
router.get('/oauth/callback', LinkedInController.oauthCallback);

export default router;
