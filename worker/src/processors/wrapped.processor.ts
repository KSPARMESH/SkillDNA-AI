import { WrappedService } from '../services/wrapped.service';

export async function processWrapped(jobData: { userId: string; year: number }) {
  console.log(`[WrappedProcessor] Building Wrapped ${jobData.year} for user ${jobData.userId}...`);
  const wrappedData = await WrappedService.generateWrapped(jobData.userId, jobData.year);
  return { wrappedData, status: 'COMPLETED' };
}
