import { PlatformType } from '@skilldna/shared';
import { IntegrationRepository } from '../repositories/integration.repository';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';
import { NormalizationService } from './normalization.service';
import { ISyncOptions, ISyncResult } from '../interfaces/integration.interface';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';
import { IntegrationNotFoundError, RateLimitExceededError } from '../errors/integration.errors';

export class SyncService {
  static async syncPlatform(
    userId: string,
    platform: PlatformType,
    options: ISyncOptions = {},
  ): Promise<ISyncResult> {
    const integration = await IntegrationRepository.findByUserIdAndPlatform(userId, platform);
    if (!integration || !integration.isConnected) {
      throw new IntegrationNotFoundError(`Connected integration for '${platform}'`);
    }

    const adapter = PlatformAdapterFactory.getAdapter(platform);
    await IntegrationRepository.updateSyncStatus(integration.id, 'SYNCING');

    const maxRetries = options.maxRetries || INTEGRATION_CONSTANTS.MAX_RETRY_ATTEMPTS;
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= maxRetries) {
      try {
        const fetchedData = await adapter.fetchData(integration.username, integration.accessToken);

        // Check if fetchedData contains an unverified identity or platform limitation notice
        if (fetchedData.limitation) {
          const isAuthLimitation =
            fetchedData.limitation.toLowerCase().includes('oauth') ||
            fetchedData.limitation.toLowerCase().includes('token') ||
            fetchedData.limitation.toLowerCase().includes('authorization') ||
            fetchedData.limitation.toLowerCase().includes('credential');

          const limitationStatus = isAuthLimitation ? 'NEEDS_AUTH' : 'PARTIAL';

          // Persist partial normalized data if any exists
          await NormalizationService.normalizeAndPersist(userId, platform, fetchedData);

          // Update sync status to non-success status WITHOUT setting lastSyncedAt
          await IntegrationRepository.updateSyncStatus(
            integration.id,
            limitationStatus,
            undefined, // Do NOT set lastSyncedAt for limited/partial sync
            {
              ...(fetchedData.rawMetadata || {}),
              limitation: fetchedData.limitation,
              lastError: fetchedData.limitation,
            },
          );

          return {
            integrationId: integration.id,
            platform,
            status: limitationStatus,
            recordsProcessed: 0,
            syncedAt: new Date(),
            limitation: fetchedData.limitation,
            data: fetchedData,
          };
        }

        await NormalizationService.normalizeAndPersist(userId, platform, fetchedData);

        await IntegrationRepository.updateSyncStatus(
          integration.id,
          'SUCCESS',
          new Date(),
          fetchedData.rawMetadata || {},
        );

        return {
          integrationId: integration.id,
          platform,
          status: 'SUCCESS',
          recordsProcessed: 1,
          syncedAt: new Date(),
          limitation: fetchedData.limitation,
          data: fetchedData,
        };
      } catch (error: any) {
        lastError = error;

        if (error instanceof RateLimitExceededError) {
          const resetIso = error.resetAt ? error.resetAt.toISOString() : undefined;
          await IntegrationRepository.updateSyncStatus(
            integration.id,
            'RATE_LIMITED',
            undefined, // Do NOT update lastSyncedAt
            {
              lastError: error.message,
              retryAfterSeconds: error.retryAfterSeconds,
              rateLimitResetAt: resetIso,
            },
          );
          return {
            integrationId: integration.id,
            platform,
            status: 'RATE_LIMITED',
            recordsProcessed: 0,
            syncedAt: new Date(),
            error: error.message,
          };
        }

        attempt++;
        if (attempt <= maxRetries) {
          const backoff = Math.pow(2, attempt) * INTEGRATION_CONSTANTS.RETRY_BACKOFF_BASE_MS;
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }

    const failureReason = lastError?.message || 'Synchronization failed after maximum retries';
    await IntegrationRepository.updateSyncStatus(integration.id, 'FAILED', undefined, {
      lastError: failureReason,
      failedAt: new Date().toISOString(),
    });

    return {
      integrationId: integration.id,
      platform,
      status: 'FAILED',
      recordsProcessed: 0,
      syncedAt: new Date(),
      error: failureReason,
    };
  }

  static async syncAllUserIntegrations(
    userId: string,
    options: ISyncOptions = {},
  ): Promise<ISyncResult[]> {
    const integrations = await IntegrationRepository.findAllByUserId(userId);
    const activeList = integrations.filter((i) => i.isConnected);

    const results: ISyncResult[] = [];
    for (const item of activeList) {
      try {
        const res = await this.syncPlatform(userId, item.platform as PlatformType, options);
        results.push(res);
      } catch (err: any) {
        results.push({
          integrationId: item.id,
          platform: item.platform as PlatformType,
          status: 'FAILED',
          recordsProcessed: 0,
          syncedAt: new Date(),
          error: err.message,
        });
      }
    }
    return results;
  }
}
