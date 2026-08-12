import { PlatformType } from '@skilldna/shared';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';
import { SyncRepository } from '../repositories/sync.repository';

export class HackerRankService {
  static async syncUserData(userId: string, username: string) {
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.HACKERRANK);
    const result = await adapter.fetchData(username);

    if (result.codingStats) {
      await SyncRepository.saveCodingStats(userId, PlatformType.HACKERRANK, result.codingStats);
    }
    return result;
  }
}
