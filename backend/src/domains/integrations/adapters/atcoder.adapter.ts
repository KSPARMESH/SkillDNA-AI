import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import { IntegrationNotFoundError, SyncFailedError } from '../errors/integration.errors';

export class AtCoderAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.ATCODER;

  async validateCredentials(username: string): Promise<boolean> {
    if (!(await super.validateCredentials(username))) return false;
    const cleanUsername = this.sanitizeUsername(username);

    try {
      const res = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.ATCODER}/user/info?user=${cleanUsername}`,
      );
      if (!res.ok) return false;
      const data: any = await res.json();
      return !!data && typeof data === 'object';
    } catch {
      return false;
    }
  }

  async fetchData(username: string): Promise<NormalizedPlatformResult> {
    const cleanUsername = this.sanitizeUsername(username);

    const infoRes = await fetch(
      `${INTEGRATION_CONSTANTS.API_ENDPOINTS.ATCODER}/user/info?user=${cleanUsername}`,
    );
    if (!infoRes.ok) {
      throw new SyncFailedError('ATCODER', `AtCoder API error ${infoRes.status}`);
    }

    const userInfo: any = await infoRes.json();
    if (!userInfo || typeof userInfo !== 'object' || !userInfo.user_id) {
      throw new IntegrationNotFoundError(`AtCoder user '${cleanUsername}'`);
    }

    return {
      platform: this.platformName,
      username: cleanUsername,
      codingStats: {
        totalSolved: userInfo.accepted_count || 0,
        easySolved: Math.round((userInfo.accepted_count || 0) * 0.5),
        mediumSolved: Math.round((userInfo.accepted_count || 0) * 0.35),
        hardSolved: Math.round((userInfo.accepted_count || 0) * 0.15),
        contestRating: userInfo.rating || 0,
        badgesCount: 0,
      },
      rawMetadata: {
        acceptedCount: userInfo.accepted_count,
        ratedPointSum: userInfo.rated_point_sum,
        syncedAt: new Date().toISOString(),
      },
    };
  }
}
