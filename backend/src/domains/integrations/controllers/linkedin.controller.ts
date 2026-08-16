import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth.middleware';
import { OAuthService } from '../services/oauth.service';
import { IntegrationRepository } from '../repositories/integration.repository';
import { SyncService } from '../services/sync.service';
import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import { generateOAuthState, verifyAndConsumeOAuthState } from '../utils/oauth.state.util';

export class LinkedInController {
  /**
   * Generates a cryptographically signed OAuth authorization URL for the authenticated user.
   */
  static getOAuthUrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const redirectUri = (req.query.redirectUri as string) || undefined;

      // 1. Generate signed state bound to authenticated user
      const state = generateOAuthState(userId);

      // 2. Generate authorization URL with signed state
      const url = OAuthService.getAuthorizationUrl(PlatformType.LINKEDIN, state, redirectUri);

      res.status(200).json({
        success: true,
        data: { url },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles OAuth callback from LinkedIn authorization server.
   * Verifies state, exchanges code for tokens, verifies identity from /userinfo,
   * encrypts/persists integration in database, triggers initial sync, and redirects to frontend.
   */
  static async oauthCallback(req: Request, res: Response, next: NextFunction) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const redirectWithError = (reason: string) => {
      const target = `${clientUrl}/integrations?linkedin=error&reason=${encodeURIComponent(reason)}`;
      return res.redirect(302, target);
    };

    try {
      const code = req.query.code ? String(req.query.code).trim() : '';
      const state = req.query.state ? String(req.query.state).trim() : '';
      const errorParam = req.query.error ? String(req.query.error) : '';

      // 1. Check for provider-level user cancellation / error
      if (errorParam) {
        return redirectWithError(
          errorParam === 'user_cancelled_authorize' ? 'cancelled' : 'oauth_denied',
        );
      }

      if (!code || !state) {
        return redirectWithError('missing_parameters');
      }

      // 2. Cryptographically verify and consume OAuth state (validates signature, expiry, and replay)
      let userId: string;
      try {
        const stateVerification = verifyAndConsumeOAuthState(state);
        userId = stateVerification.userId;
      } catch (stateErr: any) {
        return redirectWithError('invalid_state');
      }

      // 3. Exchange authorization code for access and refresh tokens
      let tokens: { accessToken: string; refreshToken?: string; expiresIn?: number };
      try {
        tokens = await OAuthService.exchangeCodeForToken(PlatformType.LINKEDIN, code);
      } catch (tokenErr: any) {
        return redirectWithError('token_exchange_failed');
      }

      // 4. Verify LinkedIn identity via /userinfo endpoint
      let userInfo: any;
      try {
        const userInfoRes = await fetch(
          `${INTEGRATION_CONSTANTS.API_ENDPOINTS.LINKEDIN}/userinfo`,
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
              Accept: 'application/json',
            },
          },
        );

        if (!userInfoRes.ok) {
          return redirectWithError('identity_verification_failed');
        }

        userInfo = await userInfoRes.json();
      } catch (userInfoErr: any) {
        return redirectWithError('identity_verification_failed');
      }

      // Extract verified identity
      const verifiedUsername =
        userInfo.name ||
        userInfo.email ||
        (userInfo.sub ? `linkedin_${userInfo.sub.slice(0, 8)}` : 'LinkedIn User');

      // 5. Encrypt access/refresh tokens and persist PlatformIntegration record
      await IntegrationRepository.upsertIntegration({
        userId,
        platform: PlatformType.LINKEDIN,
        username: verifiedUsername,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        metadata: {
          sub: userInfo.sub,
          email: userInfo.email,
          picture: userInfo.picture,
          locale: userInfo.locale,
          verifiedAt: new Date().toISOString(),
        },
      });

      // 6. Trigger initial platform synchronization in background
      SyncService.syncPlatform(userId, PlatformType.LINKEDIN, { mode: 'FULL' }).catch((syncErr) => {
        console.error('Background LinkedIn initial sync notice:', syncErr.message);
      });

      // 7. Secure browser redirect back to frontend integrations page (no tokens in URL or body)
      return res.redirect(302, `${clientUrl}/integrations?linkedin=connected`);
    } catch (error: any) {
      return redirectWithError('unexpected_error');
    }
  }
}
