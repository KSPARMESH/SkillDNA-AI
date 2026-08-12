import { PlatformType } from '@skilldna/shared';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';
import { SyncRepository } from '../repositories/sync.repository';
import { IntegrationRepository } from '../repositories/integration.repository';

export class GitHubService {
  static async syncUserData(userId: string, username: string, accessToken?: string) {
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.GITHUB);
    const result = await adapter.fetchData(username, accessToken);

    if (result.githubStats) {
      await SyncRepository.saveGitHubStats(userId, result.githubStats);

      if (result.githubStats.recentProjects) {
        for (const proj of result.githubStats.recentProjects) {
          await SyncRepository.upsertUserProject(userId, {
            title: proj.name,
            description: proj.description || `GitHub repository: ${proj.name}`,
            repoUrl: proj.url,
            starsCount: proj.stars,
            forksCount: proj.forks,
            techStack: proj.language ? [proj.language] : [],
          });
        }
      }
    }

    return result;
  }

  static async handleWebhookPushEvent(userId: string, payload: any) {
    const integration = await IntegrationRepository.findByUserIdAndPlatform(
      userId,
      PlatformType.GITHUB,
    );
    if (!integration) return null;

    return this.syncUserData(userId, integration.username, integration.accessToken);
  }
}
