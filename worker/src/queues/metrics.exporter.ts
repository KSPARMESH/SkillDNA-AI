export class WorkerMetricsExporter {
  private static completedCount = 0;
  private static failedCount = 0;

  static recordCompleted() {
    this.completedCount++;
  }

  static recordFailed() {
    this.failedCount++;
  }

  static getMetrics() {
    return {
      completedJobsTotal: this.completedCount,
      failedJobsTotal: this.failedCount,
      uptimeSeconds: process.uptime(),
    };
  }
}
