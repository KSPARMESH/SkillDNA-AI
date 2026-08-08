export class QueryMetricsTracker {
  private static metrics: Array<{ queryName: string; durationMs: number; timestamp: Date }> = [];

  static recordQuery(queryName: string, durationMs: number) {
    this.metrics.push({ queryName, durationMs, timestamp: new Date() });
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  static getMetrics() {
    return [...this.metrics];
  }
}
