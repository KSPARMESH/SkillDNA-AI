import { AnalyticsService } from '../services/analytics.service';

export async function processAnalytics(jobData: { userId: string }) {
  console.log(`[AnalyticsProcessor] Computing analytics for user: ${jobData.userId}...`);
  const result = await AnalyticsService.computeUserAnalytics(jobData.userId);
  return { ...result, status: 'SUCCESS' };
}
