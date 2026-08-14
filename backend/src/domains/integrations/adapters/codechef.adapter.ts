import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';
import { IntegrationNotFoundError, SyncFailedError } from '../errors/integration.errors';

export class CodeChefAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.CODECHEF;

  async validateCredentials(username: string): Promise<boolean> {
    if (!(await super.validateCredentials(username))) return false;
    const cleanUsername = this.sanitizeUsername(username);

    try {
      const res = await fetch(
        `https://www.codechef.com/users/${encodeURIComponent(cleanUsername)}`,
        {
          headers: {
            'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)',
          },
        },
      );
      return res.ok || res.status === 200;
    } catch {
      return false;
    }
  }

  async fetchData(username: string): Promise<NormalizedPlatformResult> {
    const cleanUsername = this.sanitizeUsername(username);

    let profileRes: Response;
    try {
      profileRes = await fetch(
        `https://www.codechef.com/users/${encodeURIComponent(cleanUsername)}`,
        {
          headers: {
            'User-Agent': 'SkillDNA-AI/1.0 (Integration Bot; contact@skilldna.ai)',
          },
        },
      );
    } catch (err: any) {
      throw new SyncFailedError(
        this.platformName,
        `Network error communicating with CodeChef: ${err.message}`,
      );
    }

    if (profileRes.status === 404) {
      throw new IntegrationNotFoundError(`CodeChef user '${cleanUsername}'`);
    }

    if (!profileRes.ok) {
      throw new SyncFailedError(
        this.platformName,
        `CodeChef profile query returned status ${profileRes.status}`,
      );
    }

    const html = await profileRes.text();

    // Parse rating and solved problem counts from HTML
    const ratingMatch = html.match(/class="rating-number"[^>]*>([0-9]+)<\/div>/i);
    const starsMatch = html.match(/class="rating-star"[^>]*><span>([0-9★*]+)<\/span>/i);
    const globalRankMatch = html.match(
      /class="rating-ranks"[^>]*>.*?global.*?<strong>([0-9,]+)<\/strong>/is,
    );
    const countryRankMatch = html.match(
      /class="rating-ranks"[^>]*>.*?country.*?<strong>([0-9,]+)<\/strong>/is,
    );
    const solvedMatch =
      html.match(/Total Problems Solved:?\s*([0-9]+)/i) ||
      html.match(/Fully Solved\s*\(([0-9]+)\)/i);

    const contestRating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;
    const totalSolved = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;
    const globalRank = globalRankMatch ? parseInt(globalRankMatch[1].replace(/,/g, ''), 10) : null;
    const countryRank = countryRankMatch
      ? parseInt(countryRankMatch[1].replace(/,/g, ''), 10)
      : null;

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
        ranking: globalRank,
        badgesCount: 0,
      },
      rawMetadata: {
        stars: starsMatch ? starsMatch[1] : undefined,
        globalRank,
        countryRank,
        syncedAt: new Date().toISOString(),
      },
    };
  }
}
