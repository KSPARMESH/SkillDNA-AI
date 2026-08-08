export class IntegrationsService {
  static async syncPlatform(userId: string, platform: string) {
    return {
      platform,
      synced: true,
      lastSyncedAt: new Date().toISOString(),
      stats: { publicRepos: 15, commits: 340, stars: 45 },
    };
  }
}
