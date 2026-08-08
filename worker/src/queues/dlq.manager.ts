export class DeadLetterQueueManager {
  private static failedJobs: Array<{ jobId: string; queueName: string; error: string; timestamp: string }> = [];

  static recordFailedJob(jobId: string, queueName: string, error: Error) {
    console.error(`🚨 [DLQ] Moving failed job ${jobId} from ${queueName} to Dead Letter Queue:`, error.message);
    this.failedJobs.push({
      jobId,
      queueName,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  static getFailedJobs() {
    return this.failedJobs;
  }
}
