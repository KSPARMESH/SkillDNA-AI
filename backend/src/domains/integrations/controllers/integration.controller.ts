import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth.middleware';
import {
  validateConnectPlatform,
  validateDisconnectPlatform,
} from '../validators/integration.validator';
import { IntegrationRepository } from '../repositories/integration.repository';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';
import { SyncService } from '../services/sync.service';
import { PlatformType, getPlatformDisplayName } from '@skilldna/shared';
import { IntegrationNotFoundError, OAuthAuthenticationError } from '../errors/integration.errors';

export class IntegrationController {
  static async connect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const payload = validateConnectPlatform(req.body);

      // 1. Resolve adapter
      const adapter = PlatformAdapterFactory.getAdapter(payload.platform);

      // 2. Pre-persistence verification
      const githubAccessToken =
        payload.platform === PlatformType.GITHUB ? undefined : payload.accessToken;
      const githubRefreshToken =
        payload.platform === PlatformType.GITHUB ? undefined : payload.refreshToken;
      const githubMetadata =
        payload.platform === PlatformType.GITHUB ? undefined : payload.metadata;

      // LinkedIn requires OAuth token
      if (payload.platform === PlatformType.LINKEDIN && !payload.accessToken) {
        throw new OAuthAuthenticationError(
          'LinkedIn requires OAuth authorization. Connect via LinkedIn OAuth2 flow.',
        );
      }

      // Kaggle requires API credentials
      if (
        payload.platform === PlatformType.KAGGLE &&
        !payload.accessToken &&
        !process.env.KAGGLE_API_TOKEN &&
        !process.env.KAGGLE_KEY
      ) {
        throw new OAuthAuthenticationError(
          'Kaggle requires API credentials (KAGGLE_API_TOKEN / KAGGLE_KEY).',
        );
      }

      // Validate account existence / credentials with platform
      const isValid = await adapter.validateCredentials(payload.username, githubAccessToken);

      if (!isValid) {
        if (payload.platform === PlatformType.LINKEDIN) {
          throw new OAuthAuthenticationError('LinkedIn OAuth token is invalid or expired.');
        }
        if (payload.platform === PlatformType.KAGGLE) {
          throw new OAuthAuthenticationError('Kaggle credentials invalid or user not found.');
        }
        throw new IntegrationNotFoundError(
          `${getPlatformDisplayName(payload.platform)} account '${payload.username}'`,
        );
      }

      // 3. Persist integration ONLY AFTER validation succeeds
      const integration = await IntegrationRepository.upsertIntegration({
        userId,
        platform: payload.platform,
        username: payload.username,
        accessToken: githubAccessToken,
        refreshToken: githubRefreshToken,
        metadata: githubMetadata,
      });

      // 4. Automatically trigger initial sync upon successful verified connection
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
