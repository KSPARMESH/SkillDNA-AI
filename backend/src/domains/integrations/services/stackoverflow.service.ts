import { PlatformType } from '@skilldna/shared';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';

export class StackOverflowService {
  static async syncUserData(userId: string, username: string) {
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.STACKOVERFLOW);
    return adapter.fetchData(username);
  }
}
