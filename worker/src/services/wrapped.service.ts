export class WrappedService {
  static async generateWrapped(userId: string, year: number) {
    return {
      userId,
      year,
      totalCommits: 340,
      topLanguage: 'TypeScript',
      repositoriesContributed: 15,
      percentileGrowth: 95.4,
    };
  }
}
