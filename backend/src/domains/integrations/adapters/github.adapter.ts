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
      return response.ok;
    } catch (error) {
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

    const userRes = await fetch(
      `${INTEGRATION_CONSTANTS.API_ENDPOINTS.GITHUB}/users/${cleanUsername}`,
      { headers },
    );

    if (userRes.status === 404) {
      throw new IntegrationNotFoundError(`GitHub user '${cleanUsername}'`);
    }
    if (userRes.status === 429) {
      throw new RateLimitExceededError('GITHUB');
    }
    if (!userRes.ok) {
      throw new SyncFailedError(
        'GITHUB',
        `GitHub API error ${userRes.status}: ${userRes.statusText}`,
      );
    }

    const userData: any = await userRes.json();

    const reposRes = await fetch(
      `${INTEGRATION_CONSTANTS.API_ENDPOINTS.GITHUB}/users/${cleanUsername}/repos?per_page=100&sort=updated`,
      { headers },
    );

    let repos: any[] = [];
    if (reposRes.ok) {
      repos = await reposRes.json();
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
