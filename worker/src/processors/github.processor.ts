import { GitHubApiService } from '../services/github-api.service';

export async function processGitHubSync(jobData: { userId: string; username: string }) {
  console.log(`[GitHubProcessor] Syncing stats for username: ${jobData.username}...`);
  const stats = await GitHubApiService.fetchUserStats(jobData.username);
  return { userId: jobData.userId, ...stats, status: 'SUCCESS' };
}
