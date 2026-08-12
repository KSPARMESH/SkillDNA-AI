import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';

export class MediumAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.MEDIUM;

  async validateCredentials(username: string): Promise<boolean> {
    if (!(await super.validateCredentials(username))) return false;
    const cleanUsername = this.sanitizeUsername(username);

    try {
      const res = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.MEDIUM_RSS}/@${cleanUsername}`,
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  async fetchData(username: string, accessToken?: string): Promise<NormalizedPlatformResult> {
    const cleanUsername = this.sanitizeUsername(username);

    if (accessToken) {
      try {
        const res = await fetch(`${INTEGRATION_CONSTANTS.API_ENDPOINTS.MEDIUM}/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const userObj: any = await res.json();
          return {
            platform: this.platformName,
            username: cleanUsername,
            mediumStats: {
              totalArticles: 0,
              articles: [],
            },
            rawMetadata: {
              id: userObj.data?.id,
              name: userObj.data?.name,
              url: userObj.data?.url,
              syncedAt: new Date().toISOString(),
            },
          };
        }
      } catch {
        // Fall back to RSS
      }
    }

    try {
      const rssRes = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.MEDIUM_RSS}/@${cleanUsername}`,
      );
      if (rssRes.ok) {
        const xmlText = await rssRes.text();
        const itemMatches = xmlText.match(/<item>/g) || [];
        const titleMatches = Array.from(
          xmlText.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g),
        ).map((m) => m[1]);
        const linkMatches = Array.from(xmlText.matchAll(/<link>(.*?)<\/link>/g)).map((m) => m[1]);

        const articles = titleMatches.map((title, i) => ({
          title,
          link: linkMatches[i + 1] || `https://medium.com/@${cleanUsername}`,
          pubDate: new Date().toISOString(),
        }));

        return {
          platform: this.platformName,
          username: cleanUsername,
          mediumStats: {
            totalArticles: itemMatches.length,
            articles,
          },
          rawMetadata: {
            source: 'Medium RSS Feed',
            syncedAt: new Date().toISOString(),
          },
        };
      }
    } catch {
      // Fallback
    }

    return {
      platform: this.platformName,
      username: cleanUsername,
      limitation: `Medium RSS feed for '@${cleanUsername}' unavailable. Metadata placeholder created.`,
      mediumStats: {
        totalArticles: 0,
        articles: [],
      },
      rawMetadata: { syncedAt: new Date().toISOString() },
    };
  }
}
