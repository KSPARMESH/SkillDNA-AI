import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import { IntegrationNotFoundError, SyncFailedError } from '../errors/integration.errors';

export class CodeforcesAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.CODEFORCES;

  async validateCredentials(username: string): Promise<boolean> {
    if (!(await super.validateCredentials(username))) return false;
    const cleanUsername = this.sanitizeUsername(username);

    try {
      const res = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.CODEFORCES}/user.info?handles=${cleanUsername}`,
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

    const infoRes = await fetch(
      `${INTEGRATION_CONSTANTS.API_ENDPOINTS.CODEFORCES}/user.info?handles=${cleanUsername}`,
    );
    if (!infoRes.ok) {
      throw new SyncFailedError('CODEFORCES', `Codeforces API error ${infoRes.status}`);
    }

    const infoData: any = await infoRes.json();
    if (infoData.status !== 'OK' || !infoData.result || infoData.result.length === 0) {
      throw new IntegrationNotFoundError(`Codeforces handle '${cleanUsername}'`);
    }

    const user = infoData.result[0];

    const statusRes = await fetch(
      `${INTEGRATION_CONSTANTS.API_ENDPOINTS.CODEFORCES}/user.status?handle=${cleanUsername}&from=1&count=500`,
    );
    let totalSolved = 0;
    const solvedProblems = new Set<string>();

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

    return {
      platform: this.platformName,
      username: cleanUsername,
      codingStats: {
        totalSolved,
        easySolved: Math.round(totalSolved * 0.4),
        mediumSolved: Math.round(totalSolved * 0.4),
        hardSolved: Math.round(totalSolved * 0.2),
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
