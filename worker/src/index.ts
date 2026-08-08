import { QueueManager } from './queues/queue.manager';
import { GitHubWorker } from './workers/github.worker';
import { AnalyticsWorker } from './workers/analytics.worker';
import { NotificationWorker } from './workers/notification.worker';
import { ReportsWorker } from './workers/reports.worker';
import { WrappedWorker } from './workers/wrapped.worker';
import { RoadmapWorker } from './workers/roadmap.worker';

async function bootstrapWorker() {
  console.log('⚡ [SkillDNA Worker] Initializing Worker Services...');
  await QueueManager.initializeQueues();

  await GitHubWorker.start();
  await AnalyticsWorker.start();
  await NotificationWorker.start();
  await ReportsWorker.start();
  await WrappedWorker.start();
  await RoadmapWorker.start();

  console.log('✅ [SkillDNA Worker] All background worker processors listening for tasks.');
}

bootstrapWorker().catch((err) => {
  console.error('❌ Worker Bootstrap Error:', err);
  process.exit(1);
});
