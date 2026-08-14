import { PlatformType } from '@skilldna/shared';
import { IPlatformAdapter } from '../interfaces/integration.interface';
import { PlatformNotSupportedError } from '../errors/integration.errors';

import { GitHubAdapter } from './github.adapter';
import { LeetCodeAdapter } from './leetcode.adapter';
import { HackerRankAdapter } from './hackerrank.adapter';
import { CodeforcesAdapter } from './codeforces.adapter';
import { AtCoderAdapter } from './atcoder.adapter';
import { KaggleAdapter } from './kaggle.adapter';
import { LinkedInAdapter } from './linkedin.adapter';
import { DevpostAdapter } from './devpost.adapter';
import { MediumAdapter } from './medium.adapter';
import { StackOverflowAdapter } from './stackoverflow.adapter';
import { CodeChefAdapter } from './codechef.adapter';

export class PlatformAdapterFactory {
  private static adapters: Map<string, IPlatformAdapter> = new Map();
  private static initialized = false;

  public static initialize(): void {
    if (this.initialized) return;

    this.registerAdapter(new GitHubAdapter());
    this.registerAdapter(new LeetCodeAdapter());
    this.registerAdapter(new HackerRankAdapter());
    this.registerAdapter(new CodeforcesAdapter());
    this.registerAdapter(new AtCoderAdapter());
    this.registerAdapter(new KaggleAdapter());
    this.registerAdapter(new LinkedInAdapter());
    this.registerAdapter(new DevpostAdapter());
    this.registerAdapter(new MediumAdapter());
    this.registerAdapter(new StackOverflowAdapter());
    this.registerAdapter(new CodeChefAdapter());

    this.initialized = true;
  }

  public static registerAdapter(adapter: IPlatformAdapter): void {
    const key = adapter.platformName.toUpperCase();
    this.adapters.set(key, adapter);
  }

  public static getAdapter(platform: PlatformType | string): IPlatformAdapter {
    this.initialize();
    const key = String(platform).toUpperCase();
    const adapter = this.adapters.get(key);

    if (!adapter) {
      throw new PlatformNotSupportedError(platform);
    }
    return adapter;
  }

  public static getRegisteredPlatforms(): string[] {
    this.initialize();
    return Array.from(this.adapters.keys());
  }
}
