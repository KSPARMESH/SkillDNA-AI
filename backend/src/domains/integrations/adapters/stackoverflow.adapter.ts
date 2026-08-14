import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import {
  IntegrationNotFoundError,
  SyncFailedError,
  RateLimitExceededError,
} from '../errors/integration.errors';

export class StackOverflowAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.STACKOVERFLOW;

  async validateCredentials(username: string): Promise<boolean> {
    if (!(await super.validateCredentials(username))) return false;
    const cleanUsername = this.sanitizeUsername(username);

    try {
      const res = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.STACKOVERFLOW}/users/${encodeURIComponent(cleanUsername)}?site=stackoverflow`,
        {
          headers: {
            'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)',
            'Accept-Encoding': 'gzip,deflate',
            Accept: 'application/json',
          },
        },
      );
      if (!res.ok) return false;
      const data: any = await res.json();
      return Array.isArray(data.items) && data.items.length > 0;
    } catch {
      return false;
    }
  }

  async fetchData(username: string): Promise<NormalizedPlatformResult> {
    const cleanUsername = this.sanitizeUsername(username);

    let res: Response;
    try {
      res = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.STACKOVERFLOW}/users/${encodeURIComponent(cleanUsername)}?site=stackoverflow`,
        {
          headers: {
            'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)',
            'Accept-Encoding': 'gzip,deflate',
            Accept: 'application/json',
          },
        },
      );
    } catch (err: any) {
      throw new SyncFailedError(
        this.platformName,
        `Network error communicating with Stack Overflow: ${err.message}`,
      );
    }

    if (res.status === 429) {
      throw new RateLimitExceededError(this.platformName);
    }

    if (res.status === 404) {
      throw new IntegrationNotFoundError(`Stack Overflow user ID '${cleanUsername}'`);
    }

    if (!res.ok) {
      throw new SyncFailedError(this.platformName, `Stack Overflow API error ${res.status}`);
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new SyncFailedError(
        this.platformName,
        'Malformed JSON response from Stack Overflow API',
      );
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new IntegrationNotFoundError(`Stack Overflow user ID '${cleanUsername}'`);
    }

    const user = data.items[0];

    return {
      platform: this.platformName,
      username: cleanUsername,
      stackOverflowStats: {
        reputation: user.reputation || 0,
        badgeCounts: {
          gold: user.badge_counts?.gold || 0,
          silver: user.badge_counts?.silver || 0,
          bronze: user.badge_counts?.bronze || 0,
        },
        answersCount: user.answer_count || 0,
        questionsCount: user.question_count || 0,
      },
      rawMetadata: {
        userId: user.user_id,
        displayName: user.display_name,
        profileImage: user.profile_image,
        userType: user.user_type,
        syncedAt: new Date().toISOString(),
      },
    };
  }
}
