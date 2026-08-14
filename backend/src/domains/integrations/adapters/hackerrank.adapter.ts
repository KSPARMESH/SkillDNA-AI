import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import {
  IntegrationNotFoundError,
  SyncFailedError,
  RateLimitExceededError,
} from '../errors/integration.errors';

export class HackerRankAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.HACKERRANK;

  async validateCredentials(username: string): Promise<boolean> {
    if (!(await super.validateCredentials(username))) return false;
    const cleanUsername = this.sanitizeUsername(username);

    try {
      const res = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.HACKERRANK}/${encodeURIComponent(cleanUsername)}/profile`,
        {
          headers: { 'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)' },
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

    let res: Response;
    try {
      res = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.HACKERRANK}/${encodeURIComponent(cleanUsername)}/profile`,
        {
          headers: { 'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)' },
        },
      );
    } catch (err: any) {
      throw new SyncFailedError(
        this.platformName,
        `Network error communicating with HackerRank: ${err.message}`,
      );
    }

    if (res.status === 429) {
      throw new RateLimitExceededError(this.platformName);
    }

    if (res.status === 404) {
      throw new IntegrationNotFoundError(`HackerRank user '${cleanUsername}'`);
    }

    if (!res.ok) {
      throw new SyncFailedError(this.platformName, `HackerRank API error ${res.status}`);
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new SyncFailedError(this.platformName, 'Malformed JSON response from HackerRank API');
    }

    const hacker = data?.model;
    if (!hacker) {
      throw new IntegrationNotFoundError(`HackerRank user '${cleanUsername}'`);
    }

    let badgesCount = 0;
    try {
      const badgesRes = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.HACKERRANK}/${encodeURIComponent(cleanUsername)}/badges`,
        {
          headers: { 'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)' },
        },
      );
      if (badgesRes.ok) {
        const badgesData: any = await badgesRes.json();
        badgesCount = Array.isArray(badgesData?.models) ? badgesData.models.length : 0;
      }
    } catch {
      // Non-fatal fallback
    }

    const totalSolved = typeof hacker.solved_challenges === 'number' ? hacker.solved_challenges : 0;
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
