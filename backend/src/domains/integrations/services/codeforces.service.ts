import { PlatformType } from '@skilldna/shared';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';
import { SyncRepository } from '../repositories/sync.repository';

export class CodeforcesService {
  static async syncUserData(userId: string, username: string) {
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.CODEFORCES);
    const result = await adapter.fetchData(username);

    if (result.codingStats) {
      await SyncRepository.saveCodingStats(userId, PlatformType.CODEFORCES, result.codingStats);
    }
    return result;
  }
}
