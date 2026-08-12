import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth.middleware';
import { OAuthService } from '../services/oauth.service';
import { GitHubService } from '../services/github.service';
import { PlatformType } from '@skilldna/shared';

export class GitHubController {
  static getOAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const state = (req.query.state as string) || undefined;
      const redirectUri = (req.query.redirectUri as string) || undefined;
      const url = OAuthService.getAuthorizationUrl(PlatformType.GITHUB, state, redirectUri);

      res.status(200).json({
        success: true,
        data: { url },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async oauthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = String(req.query.code || '');
      const redirectUri = (req.query.redirectUri as string) || undefined;
      const tokens = await OAuthService.exchangeCodeForToken(
        PlatformType.GITHUB,
        code,
        redirectUri,
      );

      res.status(200).json({
        success: true,
        message: 'GitHub OAuth authorization successful.',
        data: tokens,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async sync(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'demo_user_id';
      const username = req.params.username || req.body.username;
      const accessToken = req.body.accessToken;

      const result = await GitHubService.syncUserData(userId, username, accessToken);

      res.status(200).json({
        success: true,
        message: 'GitHub user data synchronized successfully.',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
