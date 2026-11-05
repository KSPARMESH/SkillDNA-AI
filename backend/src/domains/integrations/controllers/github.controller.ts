import { Request, Response, NextFunction } from 'express';
import { OAuthService } from '../services/oauth.service';
import { IntegrationRepository } from '../repositories/integration.repository';
import { SyncService } from '../services/sync.service';
import { PlatformType } from '@skilldna/shared';
import { generateOAuthState, verifyAndConsumeOAuthState } from '../utils/oauth.state.util';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';

export class GitHubController {
  static getOAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as Request & { user?: { id: string } }).user!.id;
      const state = generateOAuthState(userId);
      const url = OAuthService.getAuthorizationUrl(PlatformType.GITHUB, state);

      res.status(200).json({
        success: true,
        data: { url },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async oauthCallback(req: Request, res: Response) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const redirectWithError = (reason: string) =>
      res.redirect(
        302,
        `${clientUrl}/integrations?github=error&reason=${encodeURIComponent(reason)}`,
      );

    try {
      const code = req.query.code ? String(req.query.code).trim() : '';
      const state = req.query.state ? String(req.query.state).trim() : '';
      const providerError = req.query.error ? String(req.query.error) : '';

      if (providerError) {
        return redirectWithError(providerError === 'access_denied' ? 'cancelled' : 'oauth_denied');
      }
      if (!code || !state) return redirectWithError('missing_parameters');

      let userId: string;
      try {
        userId = verifyAndConsumeOAuthState(state).userId;
      } catch {
        return redirectWithError('invalid_state');
      }

      let tokens: { accessToken: string; refreshToken?: string };
      try {
        tokens = await OAuthService.exchangeCodeForToken(PlatformType.GITHUB, code);
      } catch {
        return redirectWithError('token_exchange_failed');
      }

      let identity: any;
      try {
        const identityResponse = await fetch(`${INTEGRATION_CONSTANTS.API_ENDPOINTS.GITHUB}/user`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'SkillDNA-AI-Platform-Sync',
          },
        });
        if (!identityResponse.ok) return redirectWithError('identity_verification_failed');
        identity = await identityResponse.json();
      } catch {
        return redirectWithError('identity_verification_failed');
      }

      if (typeof identity?.login !== 'string' || !identity.login.trim()) {
        return redirectWithError('identity_verification_failed');
      }

      try {
        await IntegrationRepository.upsertIntegration({
          userId,
          platform: PlatformType.GITHUB,
          username: identity.login.trim(),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          metadata: {
            githubId: identity.id,
            avatarUrl: identity.avatar_url,
            verifiedAt: new Date().toISOString(),
          },
        });
      } catch {
        return redirectWithError('persistence_failed');
      }

      void SyncService.syncPlatform(userId, PlatformType.GITHUB, { mode: 'FULL' }).catch(() => {
        // Sync status records failures; do not expose provider details or credentials in logs.
      });

      return res.redirect(302, `${clientUrl}/integrations?github=connected`);
    } catch {
      return redirectWithError('unexpected_error');
    }
  }

  static async sync(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as Request & { user?: { id: string } }).user!.id;
      const result = await SyncService.syncPlatform(userId, PlatformType.GITHUB, { mode: 'FULL' });

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
