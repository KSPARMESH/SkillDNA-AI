import { prisma } from '@skilldna/database';
import { PlatformType } from '@skilldna/shared';
import { NormalizedCodingData, NormalizedGitHubData } from '../types/integration.types';

export class SyncRepository {
  static async saveGitHubStats(userId: string, stats: NormalizedGitHubData) {
    return prisma.gitHubStat.upsert({
      where: { userId },
      create: {
        userId,
        publicRepos: stats.publicRepos,
        totalStars: stats.totalStars,
        totalForks: stats.totalForks,
        totalCommits: stats.totalCommits,
        PRsCreated: stats.PRsCreated,
        issuesSolved: stats.issuesSolved,
        topLanguages: stats.topLanguages || {},
        contributionGraph: stats.contributionGraph || {},
        syncedAt: new Date(),
      },
      update: {
        publicRepos: stats.publicRepos,
        totalStars: stats.totalStars,
        totalForks: stats.totalForks,
        totalCommits: stats.totalCommits,
        PRsCreated: stats.PRsCreated,
        issuesSolved: stats.issuesSolved,
        topLanguages: stats.topLanguages || undefined,
        contributionGraph: stats.contributionGraph || undefined,
        syncedAt: new Date(),
      },
    });
  }

  static async saveCodingStats(
    userId: string,
    platform: PlatformType,
    stats: NormalizedCodingData,
  ) {
    return prisma.codingStat.upsert({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
      create: {
        userId,
        platform,
        totalSolved: stats.totalSolved,
        easySolved: stats.easySolved,
        mediumSolved: stats.mediumSolved,
        hardSolved: stats.hardSolved,
        ranking: stats.ranking || null,
        contestRating: stats.contestRating || null,
        badgesCount: stats.badgesCount,
        syncedAt: new Date(),
      },
      update: {
        totalSolved: stats.totalSolved,
        easySolved: stats.easySolved,
        mediumSolved: stats.mediumSolved,
        hardSolved: stats.hardSolved,
        ranking: stats.ranking !== undefined ? stats.ranking : undefined,
        contestRating: stats.contestRating !== undefined ? stats.contestRating : undefined,
        badgesCount: stats.badgesCount,
        syncedAt: new Date(),
      },
    });
  }

  static async getGitHubStatsByUserId(userId: string) {
    return prisma.gitHubStat.findUnique({
      where: { userId },
    });
  }

  static async getCodingStatsByUserId(userId: string, platform?: PlatformType) {
    if (platform) {
      return prisma.codingStat.findUnique({
        where: {
          userId_platform: {
            userId,
            platform,
          },
        },
      });
    }
    return prisma.codingStat.findMany({
      where: { userId },
    });
  }

  static async upsertUserProject(
    userId: string,
    project: {
      title: string;
      description: string;
      repoUrl?: string;
      starsCount?: number;
      forksCount?: number;
      techStack?: string[];
    },
  ) {
    const slug = project.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!slug) return null;

    return prisma.project.upsert({
      where: {
        userId_slug: {
          userId,
          slug,
        },
      },
      create: {
        userId,
        title: project.title,
        slug,
        description: project.description || 'Imported from platform integration.',
        repoUrl: project.repoUrl,
        starsCount: project.starsCount || 0,
        forksCount: project.forksCount || 0,
        techStack: project.techStack || [],
      },
      update: {
        title: project.title,
        description: project.description || undefined,
        repoUrl: project.repoUrl || undefined,
        starsCount: project.starsCount !== undefined ? project.starsCount : undefined,
        forksCount: project.forksCount !== undefined ? project.forksCount : undefined,
        techStack: project.techStack || undefined,
      },
    });
  }
}
