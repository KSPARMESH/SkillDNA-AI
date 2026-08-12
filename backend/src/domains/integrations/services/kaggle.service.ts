import { PlatformType } from '@skilldna/shared';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';

export class KaggleService {
  static async syncUserData(userId: string, username: string, accessToken?: string) {
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.KAGGLE);
    return adapter.fetchData(username, accessToken);
  }
}
