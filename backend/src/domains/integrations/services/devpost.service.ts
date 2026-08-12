import { PlatformType } from '@skilldna/shared';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';
import { SyncRepository } from '../repositories/sync.repository';

export class DevpostService {
  static async syncUserData(userId: string, username: string) {
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.DEVPOST);
    const result = await adapter.fetchData(username);

    if (result.devpostStats?.projects) {
      for (const proj of result.devpostStats.projects) {
        await SyncRepository.upsertUserProject(userId, {
          title: proj.title,
          description: proj.tagline || `Devpost Hackathon Project: ${proj.title}`,
          repoUrl: proj.url,
        });
      }
    }

    return result;
  }
}
