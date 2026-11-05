import { Router } from 'express';
import { GitHubController } from '../controllers/github.controller';
import { authenticate } from '../../../middleware/auth.middleware';

const router = Router();

router.get('/oauth/url', authenticate, GitHubController.getOAuthUrl);
router.get('/oauth/callback', GitHubController.oauthCallback);
router.post('/sync/:username?', authenticate, GitHubController.sync);

export default router;
