import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth.middleware';
import {
  validateConnectPlatform,
  validateDisconnectPlatform,
} from '../validators/integration.validator';
import { IntegrationRepository } from '../repositories/integration.repository';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';
import { SyncService } from '../services/sync.service';

export class IntegrationController {
  static async connect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const payload = validateConnectPlatform(req.body);

      const integration = await IntegrationRepository.upsertIntegration({
        userId,
        platform: payload.platform,
        username: payload.username,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        metadata: payload.metadata,
      });

      // Automatically trigger initial sync upon connection
      SyncService.syncPlatform(userId, payload.platform, { mode: 'FULL' }).catch((err) => {
        console.error(`Initial sync failed for ${payload.platform}:`, err.message);
      });

      res.status(200).json({
        success: true,
        message: `Successfully connected ${payload.platform} integration. Initial synchronization initiated.`,
        data: {
          id: integration.id,
          platform: integration.platform,
          username: integration.username,
          isConnected: integration.isConnected,
          syncStatus: integration.syncStatus,
          createdAt: integration.createdAt,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async disconnect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const payload = validateDisconnectPlatform(req.body);

      await IntegrationRepository.disconnectIntegration(userId, payload.platform);

      res.status(200).json({
        success: true,
        message: `Successfully disconnected platform ${payload.platform}.`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async listIntegrations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const integrations = await IntegrationRepository.findAllByUserId(userId);

      const safeIntegrations = integrations.map((item) => ({
        id: item.id,
        platform: item.platform,
        username: item.username,
        isConnected: item.isConnected,
        lastSyncedAt: item.lastSyncedAt,
        syncStatus: item.syncStatus,
        metadata: item.metadata,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      res.status(200).json({
        success: true,
        data: safeIntegrations,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getIntegrationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const integrations = await IntegrationRepository.findAllByUserId(userId);

      const statusMap = integrations.map((i) => ({
        platform: i.platform,
        username: i.username,
        isConnected: i.isConnected,
        syncStatus: i.syncStatus,
        lastSyncedAt: i.lastSyncedAt,
      }));

      res.status(200).json({
        success: true,
        data: statusMap,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSupportedPlatforms(req: Request, res: Response, next: NextFunction) {
    try {
      const platforms = PlatformAdapterFactory.getRegisteredPlatforms();
      res.status(200).json({
        success: true,
        data: {
          supportedPlatforms: platforms,
          totalCount: platforms.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
