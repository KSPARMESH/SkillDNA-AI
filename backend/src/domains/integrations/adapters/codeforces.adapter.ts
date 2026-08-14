import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import {
  IntegrationNotFoundError,
  SyncFailedError,
  RateLimitExceededError,
} from '../errors/integration.errors';

export class CodeforcesAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.CODEFORCES;

  async validateCredentials(username: string): Promise<boolean> {
    if (!(await super.validateCredentials(username))) return false;
    const cleanUsername = this.sanitizeUsername(username);

    try {
      const res = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.CODEFORCES}/user.info?handles=${encodeURIComponent(cleanUsername)}`,
        {
          headers: {
            'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)',
          },
        },
      );
      if (!res.ok) return false;
      const data: any = await res.json();
      return data.status === 'OK' && Array.isArray(data.result) && data.result.length > 0;
    } catch {
      return false;
    }
  }

  async fetchData(username: string): Promise<NormalizedPlatformResult> {
    const cleanUsername = this.sanitizeUsername(username);

    let infoRes: Response;
    try {
      infoRes = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.CODEFORCES}/user.info?handles=${encodeURIComponent(cleanUsername)}`,
        {
          headers: {
            'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)',
          },
        },
      );
    } catch (err: any) {
      throw new SyncFailedError(
        this.platformName,
        `Network error communicating with Codeforces: ${err.message}`,
      );
    }

    if (infoRes.status === 429) {
      throw new RateLimitExceededError(this.platformName);
    }

    if (!infoRes.ok) {
      if (infoRes.status === 400 || infoRes.status === 404) {
        try {
          const errData: any = await infoRes.json();
          if (errData?.comment && String(errData.comment).toLowerCase().includes('not found')) {
            throw new IntegrationNotFoundError(`Codeforces handle '${cleanUsername}'`);
          }
        } catch (err: any) {
          if (err instanceof IntegrationNotFoundError) throw err;
        }
        throw new IntegrationNotFoundError(`Codeforces handle '${cleanUsername}'`);
      }
      throw new SyncFailedError(this.platformName, `Codeforces API error ${infoRes.status}`);
    }

    let infoData: any;
    try {
      infoData = await infoRes.json();
    } catch {
      throw new SyncFailedError(this.platformName, 'Malformed JSON response from Codeforces API');
    }

    if (
      infoData.status !== 'OK' ||
      !Array.isArray(infoData.result) ||
      infoData.result.length === 0
    ) {
      throw new IntegrationNotFoundError(`Codeforces handle '${cleanUsername}'`);
    }

    const user = infoData.result[0];

    let totalSolved = 0;
    const solvedProblems = new Set<string>();

    try {
      const statusRes = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.CODEFORCES}/user.status?handle=${encodeURIComponent(cleanUsername)}&from=1&count=500`,
        {
          headers: {
            'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)',
          },
        },
      );

      if (statusRes.ok) {
        const statusData: any = await statusRes.json();
        if (statusData.status === 'OK' && Array.isArray(statusData.result)) {
          for (const sub of statusData.result) {
            if (sub.verdict === 'OK' && sub.problem) {
              const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
              solvedProblems.add(problemId);
            }
          }
          totalSolved = solvedProblems.size;
        }
      }
    } catch {
      // Non-fatal, fallback to totalSolved = 0
    }

    const easySolved = Math.floor(totalSolved * 0.4);
    const mediumSolved = Math.floor(totalSolved * 0.4);
    const hardSolved = Math.max(0, totalSolved - easySolved - mediumSolved);

    return {
      platform: this.platformName,
      username: cleanUsername,
      codingStats: {
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        ranking: user.maxRank ? null : undefined,
        contestRating: user.rating || 0,
        badgesCount: 0,
      },
      rawMetadata: {
        rank: user.rank,
        maxRank: user.maxRank,
        maxRating: user.maxRating,
        organization: user.organization,
        syncedAt: new Date().toISOString(),
      },
    };
  }
}
