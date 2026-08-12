import { PlatformType } from '@skilldna/shared';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';

export class LinkedInService {
  static async syncUserData(userId: string, username: string, accessToken?: string) {
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.LINKEDIN);
    return adapter.fetchData(username, accessToken);
  }
}
