import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import { OAuthAuthenticationError } from '../errors/integration.errors';
import { IntegrationRepository } from '../repositories/integration.repository';

export class OAuthService {
  static getAuthorizationUrl(platform: PlatformType, state?: string, redirectUri?: string): string {
    const config = INTEGRATION_CONSTANTS.OAUTH_ENDPOINTS[platform];
    if (!config) {
      throw new OAuthAuthenticationError(`OAuth is not supported for platform '${platform}'.`);
    }

    const clientId = process.env[`${platform}_CLIENT_ID`];
    const isProduction = process.env.NODE_ENV === 'production';

    if (!clientId && isProduction) {
      throw new OAuthAuthenticationError(
        `OAuth client configuration missing for platform '${platform}'.`,
      );
    }

    const finalClientId = clientId || 'DEMO_CLIENT_ID';
    const finalRedirectUri =
      redirectUri ||
      process.env[`${platform}_REDIRECT_URI`] ||
      `${process.env.APP_URL || 'http://localhost:5000'}/api/v1/integrations/${platform.toLowerCase()}/oauth/callback`;

    const params = new URLSearchParams({
      client_id: finalClientId,
      redirect_uri: finalRedirectUri,
      response_type: 'code',
      ...(state ? { state } : {}),
    });
    if (config.scope) params.set('scope', config.scope);

    return `${config.authUrl}?${params.toString()}`;
  }

  static async exchangeCodeForToken(
    platform: PlatformType,
    code: string,
    redirectUri?: string,
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    const config = INTEGRATION_CONSTANTS.OAUTH_ENDPOINTS[platform];
    if (!config) {
      throw new OAuthAuthenticationError(`OAuth token exchange not supported for '${platform}'.`);
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
      throw new OAuthAuthenticationError('Authorization code is missing or empty.');
    }

    const clientId = process.env[`${platform}_CLIENT_ID`];
    const clientSecret = process.env[`${platform}_CLIENT_SECRET`];

    // Synthetic fallback allowed ONLY under explicit NODE_ENV === 'test'
    if (!clientId || !clientSecret) {
      if (process.env.NODE_ENV === 'test') {
        return {
          accessToken: `mock_oauth_token_${platform}_${Date.now()}`,
          refreshToken: `mock_refresh_token_${platform}_${Date.now()}`,
          expiresIn: 3600,
        };
      }
      throw new OAuthAuthenticationError(
        `OAuth credentials are not configured for platform '${platform}'.`,
      );
    }

    const finalRedirectUri =
      redirectUri ||
      process.env[`${platform}_REDIRECT_URI`] ||
      `${process.env.APP_URL || 'http://localhost:5000'}/api/v1/integrations/${platform.toLowerCase()}/oauth/callback`;

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code.trim(),
          redirect_uri: finalRedirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        throw new OAuthAuthenticationError(
          `Provider token exchange failed with HTTP status ${response.status}`,
        );
      }

      const data: any = await response.json();
      if (!data.access_token) {
        throw new OAuthAuthenticationError('No access_token returned by OAuth provider.');
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || undefined,
        expiresIn: data.expires_in || undefined,
      };
    } catch (error: any) {
      if (error instanceof OAuthAuthenticationError) throw error;
      throw new OAuthAuthenticationError(
        'Failed to exchange authorization code with OAuth provider.',
      );
    }
  }

  static async refreshAccessToken(userId: string, platform: PlatformType): Promise<string> {
    const integration = await IntegrationRepository.findByUserIdAndPlatform(userId, platform);
    if (!integration || !integration.refreshToken) {
      throw new OAuthAuthenticationError('No refresh token stored for integration.');
    }

    const config = INTEGRATION_CONSTANTS.OAUTH_ENDPOINTS[platform];
    const clientId = process.env[`${platform}_CLIENT_ID`];
    const clientSecret = process.env[`${platform}_CLIENT_SECRET`];

    if (!config || !clientId || !clientSecret) {
      const newAccess = `refreshed_access_${platform}_${Date.now()}`;
      await IntegrationRepository.updateTokens(integration.id, newAccess, integration.refreshToken);
      return newAccess;
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: integration.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new OAuthAuthenticationError('Failed to refresh token with provider.');
    }

    const data: any = await response.json();
    const newAccess = data.access_token;
    const newRefresh = data.refresh_token || integration.refreshToken;

    await IntegrationRepository.updateTokens(integration.id, newAccess, newRefresh);
    return newAccess;
  }
}
