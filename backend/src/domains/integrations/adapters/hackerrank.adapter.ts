import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import { IntegrationNotFoundError, SyncFailedError } from '../errors/integration.errors';

export class HackerRankAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.HACKERRANK;

  async validateCredentials(username: string): Promise<boolean> {
    if (!(await super.validateCredentials(username))) return false;
    const cleanUsername = this.sanitizeUsername(username);

    try {
      const res = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.HACKERRANK}/${cleanUsername}/profile`,
        {
          headers: { 'User-Agent': 'SkillDNA-AI' },
        },
      );
      if (!res.ok) return false;
      const data: any = await res.json();
      return !!data?.model;
    } catch {
      return false;
    }
  }

  async fetchData(username: string): Promise<NormalizedPlatformResult> {
    const cleanUsername = this.sanitizeUsername(username);

    const res = await fetch(
      `${INTEGRATION_CONSTANTS.API_ENDPOINTS.HACKERRANK}/${cleanUsername}/profile`,
      {
        headers: { 'User-Agent': 'SkillDNA-AI' },
      },
    );

    if (res.status === 404) {
      throw new IntegrationNotFoundError(`HackerRank user '${cleanUsername}'`);
    }
    if (!res.ok) {
      throw new SyncFailedError('HACKERRANK', `HackerRank API error ${res.status}`);
    }

    const data: any = await res.json();
    const hacker = data?.model;
    if (!hacker) {
      throw new IntegrationNotFoundError(`HackerRank user '${cleanUsername}'`);
    }

    const badgesRes = await fetch(
      `${INTEGRATION_CONSTANTS.API_ENDPOINTS.HACKERRANK}/${cleanUsername}/badges`,
      {
        headers: { 'User-Agent': 'SkillDNA-AI' },
      },
    );
    let badgesCount = 0;
    if (badgesRes.ok) {
      const badgesData: any = await badgesRes.json();
      badgesCount = Array.isArray(badgesData?.models) ? badgesData.models.length : 0;
    }

    return {
      platform: this.platformName,
      username: cleanUsername,
      codingStats: {
        totalSolved: hacker.solved_challenges || 0,
        easySolved: Math.round((hacker.solved_challenges || 0) * 0.5),
        mediumSolved: Math.round((hacker.solved_challenges || 0) * 0.35),
        hardSolved: Math.round((hacker.solved_challenges || 0) * 0.15),
        contestRating: hacker.contest_rating || null,
        badgesCount,
      },
      rawMetadata: {
        country: hacker.country,
        school: hacker.school,
        level: hacker.level,
        syncedAt: new Date().toISOString(),
      },
    };
  }
}
