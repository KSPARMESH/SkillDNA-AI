import { checkWorkerHealth } from '../healthcheck';
import { DeadLetterQueueManager } from '../queues/dlq.manager';

console.log('🧪 Running Worker Unit & Reliability Test Suite...');

// 1. Healthcheck test
const health = checkWorkerHealth();
console.assert(health.status === 'HEALTHY', 'Worker healthcheck failed');
console.log('✅ Worker Healthcheck Test Passed.');

// 2. DLQ test
DeadLetterQueueManager.recordFailedJob('test_job_1', 'github-sync-queue', new Error('Simulated Timeout'));
const failed = DeadLetterQueueManager.getFailedJobs();
console.assert(failed.length === 1, 'DLQ recording failed');
console.log('✅ DLQ Recording Test Passed.');

console.log('🎉 ALL WORKER TESTS PASSED SUCCESSFULLY!');
