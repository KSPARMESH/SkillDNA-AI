import { WorkerMetricsExporter } from './queues/metrics.exporter';

export function checkWorkerHealth() {
  const metrics = WorkerMetricsExporter.getMetrics();
  return {
    status: 'HEALTHY',
    service: '@skilldna/worker',
    metrics,
    timestamp: new Date().toISOString(),
  };
}
