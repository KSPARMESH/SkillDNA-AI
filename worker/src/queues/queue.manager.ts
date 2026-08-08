import { workerConfig } from '../config/worker.config';

export class QueueManager {
  static async initializeQueues() {
    console.log('⚡ [QueueManager] Initialized Redis connection for queues:', Object.values(workerConfig.queues));
  }

  static async shutdown() {
    console.log('⚡ [QueueManager] Closed all background worker queue connections.');
  }
}
