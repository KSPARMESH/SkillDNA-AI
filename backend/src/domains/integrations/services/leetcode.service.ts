import { PlatformType } from '@skilldna/shared';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';
import { SyncRepository } from '../repositories/sync.repository';

export class LeetCodeService {
  static async syncUserData(userId: string, username: string) {
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.LEETCODE);
    const result = await adapter.fetchData(username);

    if (result.codingStats) {
      await SyncRepository.saveCodingStats(userId, PlatformType.LEETCODE, result.codingStats);
    }
    return result;
  }
}
