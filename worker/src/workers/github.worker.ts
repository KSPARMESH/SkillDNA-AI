import { processGitHubSync } from '../processors/github.processor';

export class GitHubWorker {
  static async start() {
    console.log('👷 [GitHubWorker] Started GitHub Sync worker process.');
  }
}
