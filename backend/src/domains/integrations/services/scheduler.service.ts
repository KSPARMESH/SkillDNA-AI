import { IntegrationRepository } from '../repositories/integration.repository';
import { SyncService } from './sync.service';

export class SchedulerService {
  private static isRunning = false;
  private static cronTimer: any = null;

  static startScheduledSync(intervalMs = 60 * 60 * 1000) {
    if (this.isRunning) return;
    this.isRunning = true;

    this.cronTimer = setInterval(() => {
      this.runBackgroundBatchSync().catch((err) => {
        console.error('Scheduled batch sync error:', err);
      });
    }, intervalMs);
  }

  static stopScheduledSync() {
    if (this.cronTimer) {
      clearInterval(this.cronTimer);
      this.cronTimer = null;
    }
    this.isRunning = false;
  }

  static async runBackgroundBatchSync(batchSize = 20) {
    const integrations = await IntegrationRepository.findActiveIntegrationsForSync(batchSize);

    const results = [];
    for (const item of integrations) {
      try {
        const res = await SyncService.syncPlatform(item.userId, item.platform, {
          mode: 'INCREMENTAL',
        });
        results.push(res);
      } catch (error: any) {
        results.push({
          integrationId: item.id,
          platform: item.platform,
          status: 'FAILED',
          error: error.message,
        });
      }
    }
    return {
      processedCount: results.length,
      results,
      executedAt: new Date().toISOString(),
    };
  }
}
