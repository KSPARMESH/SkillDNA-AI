import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth.middleware';
import { validateSyncRequest } from '../validators/integration.validator';
import { SyncService } from '../services/sync.service';
import { PlatformType, normalizePlatformType } from '@skilldna/shared';

export class SyncController {
  static async sync(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const rawPlatformParam = req.params.platform;
      const platformParam = Array.isArray(rawPlatformParam)
        ? rawPlatformParam[0]
        : rawPlatformParam;
      const payload = validateSyncRequest(req.body);

      const targetPlatform = platformParam
        ? normalizePlatformType(platformParam) || (platformParam.toUpperCase() as PlatformType)
        : payload.platform;

      if (targetPlatform) {
        const result = await SyncService.syncPlatform(userId, targetPlatform, {
          mode: payload.mode,
          force: payload.force,
        });

        res.status(200).json({
          success: true,
          message: `Platform '${targetPlatform}' synchronization completed.`,
          data: result,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const results = await SyncService.syncAllUserIntegrations(userId, {
        mode: payload.mode,
        force: payload.force,
      });

      res.status(200).json({
        success: true,
        message: 'All user connected platforms synchronization completed.',
        data: {
          totalSynced: results.length,
          successfulCount: results.filter((r) => r.status === 'SUCCESS').length,
          results,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const results = await SyncService.syncAllUserIntegrations(userId, { mode: 'INCREMENTAL' });

      res.status(200).json({
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
