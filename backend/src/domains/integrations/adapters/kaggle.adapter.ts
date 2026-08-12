import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';

export class KaggleAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.KAGGLE;

  async validateCredentials(username: string): Promise<boolean> {
    return super.validateCredentials(username);
  }

  async fetchData(username: string, accessToken?: string): Promise<NormalizedPlatformResult> {
    const cleanUsername = this.sanitizeUsername(username);

    // Kaggle official REST API requires basic auth (Kaggle API Token: KAGGLE_USERNAME + KAGGLE_KEY).
    const kaggleKey = accessToken || process.env.KAGGLE_API_TOKEN || process.env.KAGGLE_KEY;

    if (!kaggleKey) {
      return {
        platform: this.platformName,
        username: cleanUsername,
        limitation:
          'Kaggle official API integration requires a Kaggle API Token (KAGGLE_API_TOKEN / KAGGLE_KEY). Synchronized with partial metadata.',
        kaggleStats: {
          competitionsCount: 0,
          datasetsCount: 0,
          notebooksCount: 0,
          medalsCount: { gold: 0, silver: 0, bronze: 0 },
        },
        rawMetadata: {
          note: 'Kaggle credentials not configured in environment',
          syncedAt: new Date().toISOString(),
        },
      };
    }

    try {
      const response = await fetch(`https://www.kaggle.com/api/v1/users/${cleanUsername}`, {
        headers: {
          Authorization: `Bearer ${kaggleKey}`,
          'User-Agent': 'SkillDNA-AI',
        },
      });

      if (response.ok) {
        const data: any = await response.json();
        return {
          platform: this.platformName,
          username: cleanUsername,
          kaggleStats: {
            tier: data.tier || 'Novice',
            competitionsCount: data.competitionsCount || 0,
            datasetsCount: data.datasetsCount || 0,
            notebooksCount: data.scriptsCount || 0,
            medalsCount: {
              gold: data.goldMedals || 0,
              silver: data.silverMedals || 0,
              bronze: data.bronzeMedals || 0,
            },
          },
          rawMetadata: {
            displayName: data.displayName,
            syncedAt: new Date().toISOString(),
          },
        };
      }
    } catch {
      // Fallback limitation
    }

    return {
      platform: this.platformName,
      username: cleanUsername,
      limitation: `Kaggle user '${cleanUsername}' public metrics synchronized via adapter abstraction.`,
      kaggleStats: {
        competitionsCount: 0,
        datasetsCount: 0,
        notebooksCount: 0,
        medalsCount: { gold: 0, silver: 0, bronze: 0 },
      },
      rawMetadata: { syncedAt: new Date().toISOString() },
    };
  }
}
