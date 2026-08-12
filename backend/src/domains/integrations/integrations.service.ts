import { PlatformType } from '@skilldna/shared';
import { SyncService } from './services/sync.service';

export class IntegrationsService {
  static async syncPlatform(userId: string, platform: string) {
    const platformEnum = String(platform).toUpperCase() as PlatformType;
    return SyncService.syncPlatform(userId, platformEnum);
  }
}
