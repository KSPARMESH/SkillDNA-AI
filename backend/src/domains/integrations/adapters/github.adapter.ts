import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import {
  IntegrationNotFoundError,
  RateLimitExceededError,
  SyncFailedError,
} from '../errors/integration.errors';

export class GitHubAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.GITHUB;

  private checkRateLimit(response: Response): RateLimitExceededError | null {
    let remaining: string | null = null;
    let reset: string | null = null;
    let retryAfter: string | null = null;

    if (response.headers) {
      if (typeof (response.headers as any).get === 'function') {
        remaining = response.headers.get('x-ratelimit-remaining');
        reset = response.headers.get('x-ratelimit-reset');
        retryAfter = response.headers.get('retry-after');
      } else {
        remaining = (response.headers as any)['x-ratelimit-remaining'] || null;
        reset = (response.headers as any)['x-ratelimit-reset'] || null;
        retryAfter = (response.headers as any)['retry-after'] || null;
      }
    }

    const isExhausted =
      remaining !== null && remaining !== undefined && String(remaining).trim() === '0';

    if (response.status === 429 || (response.status === 403 && isExhausted)) {
      let retryAfterSeconds: number | undefined;
      let resetAt: Date | undefined;

      if (retryAfter !== null && retryAfter !== undefined) {
        const value = String(retryAfter).trim();
        const parsed = /^\d+$/.test(value) ? Number(value) : NaN;
        if (Number.isSafeInteger(parsed) && parsed > 0) {
          retryAfterSeconds = parsed;
          const candidateResetAt = new Date(Date.now() + parsed * 1000);
          if (Number.isFinite(candidateResetAt.getTime())) {
            resetAt = candidateResetAt;
          }
        }
      }

      if (!resetAt && reset !== null && reset !== undefined) {
        const value = String(reset).trim();
        const resetUnixSec = /^\d+$/.test(value) ? Number(value) : NaN;
        if (Number.isSafeInteger(resetUnixSec) && resetUnixSec > 0) {
          const candidateResetAt = new Date(resetUnixSec * 1000);
          const delayMs = candidateResetAt.getTime() - Date.now();
          if (Number.isFinite(candidateResetAt.getTime()) && delayMs > 0) {
            resetAt = candidateResetAt;
            retryAfterSeconds = Math.max(1, Math.ceil(delayMs / 1000));
          }
        }
      }

      return new RateLimitExceededError('GITHUB', retryAfterSeconds, resetAt);
    }

    return null;
  }

  async validateCredentials(username: string, accessToken?: string): Promise<boolean> {
    if (!(await super.validateCredentials(username, accessToken))) {
      return false;
    }
    const cleanUsername = this.sanitizeUsername(username);
    const headers: Record<string, string> = {
      'User-Agent': 'SkillDNA-AI-Platform-Sync',
      Accept: 'application/vnd.github.v3+json',
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.GITHUB}/users/${cleanUsername}`,
        {
          headers,
        },
      );

      if (response.status === 404) {
        return false;
      }

      const rateLimitErr = this.checkRateLimit(response);
      if (rateLimitErr) {
        throw rateLimitErr;
      }

      return response.ok;
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        throw error;
      }
      return false;
    }
  }

  async fetchData(username: string, accessToken?: string): Promise<NormalizedPlatformResult> {
    const cleanUsername = this.sanitizeUsername(username);
    const headers: Record<string, string> = {
      'User-Agent': 'SkillDNA-AI-Platform-Sync',
      Accept: 'application/vnd.github.v3+json',
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let userRes: Response;
    try {
      userRes = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.GITHUB}/users/${cleanUsername}`,
        { headers },
      );
    } catch (err: any) {
      throw new SyncFailedError(
        'GITHUB',
        `Network error communicating with GitHub: ${err.message}`,
      );
    }

    if (userRes.status === 404) {
      throw new IntegrationNotFoundError(`GitHub user '${cleanUsername}'`);
    }

    const rateLimitErr = this.checkRateLimit(userRes);
    if (rateLimitErr) {
      throw rateLimitErr;
    }

    if (!userRes.ok) {
      throw new SyncFailedError(
        'GITHUB',
        `GitHub API error ${userRes.status}: ${userRes.statusText || 'Forbidden'}`,
      );
    }

    let userData: any;
    try {
      userData = await userRes.json();
    } catch {
      throw new SyncFailedError('GITHUB', 'Malformed JSON response from GitHub API');
    }

    let reposRes: Response | undefined;
    try {
      reposRes = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.GITHUB}/users/${cleanUsername}/repos?per_page=100&sort=updated`,
        { headers },
      );
    } catch {
      // Non-fatal network error for repos
    }

    let repos: any[] = [];
    if (reposRes) {
      const reposRateLimitErr = this.checkRateLimit(reposRes);
      if (reposRateLimitErr) {
        throw reposRateLimitErr;
      }

      if (reposRes.ok) {
        try {
          repos = await reposRes.json();
        } catch {
          // Fallback to empty repos array
        }
      }
    }

    let totalStars = 0;
    let totalForks = 0;
    const topLanguages: Record<string, number> = {};
    const recentProjects: Array<{
      name: string;
      description?: string;
      url: string;
      stars: number;
      forks: number;
      language?: string;
    }> = [];

    for (const repo of repos) {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      if (repo.language) {
        topLanguages[repo.language] = (topLanguages[repo.language] || 0) + 1;
      }
      if (recentProjects.length < 10) {
        recentProjects.push({
          name: repo.name,
          description: repo.description || undefined,
          url: repo.html_url,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          language: repo.language || undefined,
        });
      }
    }

    return {
      platform: this.platformName,
      username: cleanUsername,
      githubStats: {
        publicRepos: userData.public_repos || repos.length,
        totalStars,
        totalForks,
        totalCommits: userData.public_gists || 0,
        PRsCreated: 0,
        issuesSolved: 0,
        topLanguages,
        recentProjects,
      },
      rawMetadata: {
        id: userData.id,
        bio: userData.bio,
        location: userData.location,
        avatarUrl: userData.avatar_url,
        createdAt: userData.created_at,
        syncedAt: new Date().toISOString(),
      },
    };
  }
}
