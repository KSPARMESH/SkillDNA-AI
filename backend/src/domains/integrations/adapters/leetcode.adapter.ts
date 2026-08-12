import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import { IntegrationNotFoundError, SyncFailedError } from '../errors/integration.errors';

export class LeetCodeAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.LEETCODE;

  async validateCredentials(username: string): Promise<boolean> {
    if (!(await super.validateCredentials(username))) return false;
    const cleanUsername = this.sanitizeUsername(username);

    try {
      const res = await fetch(INTEGRATION_CONSTANTS.API_ENDPOINTS.LEETCODE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'SkillDNA-AI' },
        body: JSON.stringify({
          query: `query getUserProfile($username: String!) { matchedUser(username: $username) { username } }`,
          variables: { username: cleanUsername },
        }),
      });
      if (!res.ok) return false;
      const data: any = await res.json();
      return !!data?.data?.matchedUser;
    } catch {
      return false;
    }
  }

  async fetchData(username: string): Promise<NormalizedPlatformResult> {
    const cleanUsername = this.sanitizeUsername(username);

    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
            reputation
          }
          badges {
            id
            name
          }
          submitStats {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
        }
      }
    `;

    const res = await fetch(INTEGRATION_CONSTANTS.API_ENDPOINTS.LEETCODE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'SkillDNA-AI' },
      body: JSON.stringify({ query, variables: { username: cleanUsername } }),
    });

    if (!res.ok) {
      throw new SyncFailedError('LEETCODE', `LeetCode API error ${res.status}: ${res.statusText}`);
    }

    const json: any = await res.json();
    const matchedUser = json?.data?.matchedUser;

    if (!matchedUser) {
      throw new IntegrationNotFoundError(`LeetCode user '${cleanUsername}'`);
    }

    const acSubmissions = matchedUser.submitStats?.acSubmissionNum || [];
    let totalSolved = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    for (const sub of acSubmissions) {
      if (sub.difficulty === 'All') totalSolved = sub.count || 0;
      if (sub.difficulty === 'Easy') easySolved = sub.count || 0;
      if (sub.difficulty === 'Medium') mediumSolved = sub.count || 0;
      if (sub.difficulty === 'Hard') hardSolved = sub.count || 0;
    }

    return {
      platform: this.platformName,
      username: cleanUsername,
      codingStats: {
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        ranking: matchedUser.profile?.ranking || null,
        badgesCount: (matchedUser.badges || []).length,
      },
      rawMetadata: {
        reputation: matchedUser.profile?.reputation,
        syncedAt: new Date().toISOString(),
      },
    };
  }
}
