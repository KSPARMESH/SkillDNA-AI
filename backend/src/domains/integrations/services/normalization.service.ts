import { PlatformType } from '@skilldna/shared';
import { NormalizedPlatformResult } from '../types/integration.types';
import { SyncRepository } from '../repositories/sync.repository';

export class NormalizationService {
  static async normalizeAndPersist(
    userId: string,
    platform: PlatformType,
    data: NormalizedPlatformResult,
  ) {
    const recordsProcessed = {
      githubStatsSaved: false,
      codingStatsSaved: false,
      projectsSaved: 0,
    };

    if (data.githubStats) {
      await SyncRepository.saveGitHubStats(userId, data.githubStats);
      recordsProcessed.githubStatsSaved = true;

      if (data.githubStats.recentProjects) {
        for (const proj of data.githubStats.recentProjects) {
          await SyncRepository.upsertUserProject(userId, {
            title: proj.name,
            description: proj.description || `GitHub project: ${proj.name}`,
            repoUrl: proj.url,
            starsCount: proj.stars,
            forksCount: proj.forks,
            techStack: proj.language ? [proj.language] : [],
          });
          recordsProcessed.projectsSaved += 1;
        }
      }
    }

    if (data.codingStats) {
      await SyncRepository.saveCodingStats(userId, platform, data.codingStats);
      recordsProcessed.codingStatsSaved = true;
    }

    if (data.devpostStats?.projects) {
      for (const proj of data.devpostStats.projects) {
        await SyncRepository.upsertUserProject(userId, {
          title: proj.title,
          description: proj.tagline || `Devpost Hackathon Project: ${proj.title}`,
          repoUrl: proj.url,
        });
        recordsProcessed.projectsSaved += 1;
      }
    }

    return {
      success: true,
      userId,
      platform,
      recordsProcessed,
      normalizedAt: new Date().toISOString(),
    };
  }

  static deduplicateProjects<T extends { title: string; repoUrl?: string }>(projects: T[]): T[] {
    const seen = new Set<string>();
    const result: T[] = [];

    for (const proj of projects) {
      const key = proj.repoUrl
        ? proj.repoUrl.toLowerCase().trim()
        : proj.title.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(proj);
      }
    }
    return result;
  }
}
