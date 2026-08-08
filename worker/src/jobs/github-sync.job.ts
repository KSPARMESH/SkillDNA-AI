export async function processGitHubSyncJob(userId: string) {
  console.log(`[Worker] Processing GitHub Sync for user ${userId}...`);
  return { status: 'COMPLETED', syncedCommits: 42, syncedStars: 15 };
}
