import { PlatformType } from '@skilldna/shared';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';

export class MediumService {
  static async syncUserData(userId: string, username: string, accessToken?: string) {
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.MEDIUM);
    return adapter.fetchData(username, accessToken);
  }
}
