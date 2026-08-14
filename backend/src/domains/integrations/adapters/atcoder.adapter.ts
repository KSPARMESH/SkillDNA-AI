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
      // 1. Check user info from Kenkoooo AtCoder Problems API
      const res = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.ATCODER}/user_info?user=${encodeURIComponent(cleanUsername)}`,
        {
          headers: {
            'Accept-Encoding': 'gzip,deflate',
            'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)',
            Accept: 'application/json',
          },
        },
      );
      if (!res.ok) return false;
      const data: any = await res.json();
      if (!data || typeof data !== 'object' || !data.user_id) return false;

      // 2. If user has 0 accepted count, verify profile page on atcoder.jp exists
      if (data.accepted_count === 0) {
        const profileRes = await fetch(
          `https://atcoder.jp/users/${encodeURIComponent(cleanUsername)}`,
          {
            headers: {
              'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)',
            },
          },
        );
        if (!profileRes.ok) return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async fetchData(username: string): Promise<NormalizedPlatformResult> {
    const cleanUsername = this.sanitizeUsername(username);

    let infoRes: Response;
    try {
      infoRes = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.ATCODER}/user_info?user=${encodeURIComponent(cleanUsername)}`,
        {
          headers: {
            'Accept-Encoding': 'gzip,deflate',
            'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)',
            Accept: 'application/json',
          },
        },
      );
    } catch (err: any) {
      throw new SyncFailedError(
        this.platformName,
        `Network error communicating with AtCoder Problems API: ${err.message}`,
      );
    }

    if (infoRes.status === 404) {
      throw new IntegrationNotFoundError(`AtCoder user '${cleanUsername}'`);
    }

    if (!infoRes.ok) {
      throw new SyncFailedError(this.platformName, `AtCoder API error ${infoRes.status}`);
    }

    let userInfo: any;
    try {
      userInfo = await infoRes.json();
    } catch {
      throw new SyncFailedError(
        this.platformName,
        'Malformed JSON response from AtCoder Problems API',
      );
    }

    if (!userInfo || typeof userInfo !== 'object' || !userInfo.user_id) {
      throw new IntegrationNotFoundError(`AtCoder user '${cleanUsername}'`);
    }

    // If accepted_count is 0, verify if account actually exists on AtCoder
    if (userInfo.accepted_count === 0) {
      try {
        const profileRes = await fetch(
          `https://atcoder.jp/users/${encodeURIComponent(cleanUsername)}`,
          {
            headers: {
              'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)',
            },
          },
        );
        if (profileRes.status === 404) {
          throw new IntegrationNotFoundError(`AtCoder user '${cleanUsername}'`);
        }
      } catch (err: any) {
        if (err instanceof IntegrationNotFoundError) throw err;
      }
    }

    // Fetch official contest rating and contest history from atcoder.jp history
    let contestRating = 0;
    let highestRating = 0;

    try {
      const historyRes = await fetch(
        `https://atcoder.jp/users/${encodeURIComponent(cleanUsername)}/history/json`,
        {
          headers: {
            'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)',
            Accept: 'application/json',
          },
        },
      );

      if (historyRes.ok) {
        const history: any[] = await historyRes.json();
        if (Array.isArray(history) && history.length > 0) {
          const ratedContests = history.filter((h) => h && typeof h.NewRating === 'number');
          if (ratedContests.length > 0) {
            contestRating = ratedContests[ratedContests.length - 1].NewRating || 0;
            highestRating = Math.max(...ratedContests.map((h) => h.NewRating || 0));
          }
        }
      }
    } catch {
      // Non-fatal, fallback to 0 contest rating
    }

    const totalSolved = typeof userInfo.accepted_count === 'number' ? userInfo.accepted_count : 0;
    const easySolved = Math.floor(totalSolved * 0.5);
    const mediumSolved = Math.floor(totalSolved * 0.35);
    const hardSolved = Math.max(0, totalSolved - easySolved - mediumSolved);

    return {
      platform: this.platformName,
      username: cleanUsername,
      codingStats: {
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        contestRating,
        badgesCount: 0,
      },
      rawMetadata: {
        acceptedCount: userInfo.accepted_count,
        acceptedCountRank: userInfo.accepted_count_rank,
        ratedPointSum: userInfo.rated_point_sum,
        ratedPointSumRank: userInfo.rated_point_sum_rank,
        currentRating: contestRating,
        highestRating,
        syncedAt: new Date().toISOString(),
      },
    };
  }
}
