export class GitHubApiService {
  static async fetchUserStats(username: string) {
    return {
      username,
      publicRepos: 15,
      totalStars: 45,
      totalForks: 12,
      totalCommits: 340,
      PRsCreated: 18,
      issuesSolved: 24,
      topLanguages: { TypeScript: 60, JavaScript: 25, Python: 15 },
    };
  }
}
