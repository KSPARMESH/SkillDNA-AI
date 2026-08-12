import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import { IntegrationNotFoundError, SyncFailedError } from '../errors/integration.errors';

export class StackOverflowAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.STACKOVERFLOW;

  async validateCredentials(username: string): Promise<boolean> {
    if (!(await super.validateCredentials(username))) return false;
    const cleanUsername = this.sanitizeUsername(username);

    try {
      const res = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.STACKOVERFLOW}/users/${cleanUsername}?site=stackoverflow`,
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

    const res = await fetch(
      `${INTEGRATION_CONSTANTS.API_ENDPOINTS.STACKOVERFLOW}/users/${cleanUsername}?site=stackoverflow`,
    );

    if (!res.ok) {
      throw new SyncFailedError('STACKOVERFLOW', `Stack Overflow API error ${res.status}`);
    }

    const data: any = await res.json();
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
