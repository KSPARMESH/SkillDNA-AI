import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import { OAuthAuthenticationError } from '../errors/integration.errors';

export class LinkedInAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.LINKEDIN;

  async validateCredentials(username: string, accessToken?: string): Promise<boolean> {
    if (!username) return false;
    if (!accessToken) {
      return true; // Allows connecting handle, full sync requires OAuth token
    }

    try {
      const res = await fetch(`${INTEGRATION_CONSTANTS.API_ENDPOINTS.LINKEDIN}/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async fetchData(username: string, accessToken?: string): Promise<NormalizedPlatformResult> {
    const cleanUsername = this.sanitizeUsername(username);

    if (!accessToken) {
      return {
        platform: this.platformName,
        username: cleanUsername,
        limitation:
          'LinkedIn sync requires user OAuth authorization. Connect via LinkedIn OAuth2 flow to sync full profile data.',
        linkedInStats: {
          profileUrl: `https://www.linkedin.com/in/${cleanUsername}`,
        },
        rawMetadata: { syncedAt: new Date().toISOString() },
      };
    }

    const res = await fetch(`${INTEGRATION_CONSTANTS.API_ENDPOINTS.LINKEDIN}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401 || res.status === 403) {
      throw new OAuthAuthenticationError('LinkedIn access token is invalid or expired.');
    }

    if (!res.ok) {
      return {
        platform: this.platformName,
        username: cleanUsername,
        limitation: `LinkedIn API error ${res.status}.`,
        linkedInStats: {
          profileUrl: `https://www.linkedin.com/in/${cleanUsername}`,
        },
      };
    }

    const userInfo: any = await res.json();

    return {
      platform: this.platformName,
      username: cleanUsername,
      linkedInStats: {
        headline: userInfo.headline || undefined,
        location: userInfo.locale?.country || undefined,
        summary: userInfo.name || undefined,
        profileUrl: `https://www.linkedin.com/in/${cleanUsername}`,
      },
      rawMetadata: {
        sub: userInfo.sub,
        email: userInfo.email,
        picture: userInfo.picture,
        syncedAt: new Date().toISOString(),
      },
    };
  }
}
