import { BasePlatformAdapter, NormalizedPlatformResult } from './base.adapter';
import { PlatformType } from '@skilldna/shared';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import { IntegrationNotFoundError } from '../errors/integration.errors';

export class DevpostAdapter extends BasePlatformAdapter {
  readonly platformName = PlatformType.DEVPOST;

  async validateCredentials(username: string): Promise<boolean> {
    if (!(await super.validateCredentials(username))) return false;
    const cleanUsername = this.sanitizeUsername(username);

    try {
      const res = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.DEVPOST}/users/${cleanUsername}`,
        {
          headers: { 'User-Agent': 'SkillDNA-AI' },
        },
      );
      return res.ok || res.status === 200;
    } catch {
      return false;
    }
  }

  async fetchData(username: string): Promise<NormalizedPlatformResult> {
    const cleanUsername = this.sanitizeUsername(username);

    try {
      const res = await fetch(
        `${INTEGRATION_CONSTANTS.API_ENDPOINTS.DEVPOST}/users/${cleanUsername}`,
        {
          headers: { 'User-Agent': 'SkillDNA-AI' },
        },
      );

      if (res.status === 404) {
        throw new IntegrationNotFoundError(`Devpost user '${cleanUsername}'`);
      }

      if (res.ok) {
        const data: any = await res.json();
        return {
          platform: this.platformName,
          username: cleanUsername,
          devpostStats: {
            projectsCount: data.projects_count || (data.projects ? data.projects.length : 0),
            hackathonsAttended: data.hackathons_count || 0,
            likesReceived: data.likes_count || 0,
            projects: Array.isArray(data.projects)
              ? data.projects.map((p: any) => ({
                  title: p.title,
                  tagline: p.tagline,
                  url: p.url,
                }))
              : [],
          },
          rawMetadata: { syncedAt: new Date().toISOString() },
        };
      }
    } catch (err: any) {
      if (err instanceof IntegrationNotFoundError) throw err;
    }

    return {
      platform: this.platformName,
      username: cleanUsername,
      devpostStats: {
        projectsCount: 0,
        hackathonsAttended: 0,
        likesReceived: 0,
        projects: [],
      },
      limitation: `Devpost user profile '${cleanUsername}' synchronized via adapter fallback.`,
      rawMetadata: { syncedAt: new Date().toISOString() },
    };
  }
}
