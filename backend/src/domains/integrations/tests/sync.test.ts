import assert from 'node:assert';
import { PlatformType } from '@skilldna/shared';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';
import { NormalizationService } from '../services/normalization.service';
import { IntegrationRepository } from '../repositories/integration.repository';
import { SyncService } from '../services/sync.service';

async function runSyncTests() {
  console.log('🧪 Running Synchronization & Normalization Tests...');

  // Test Case 1: Adapter Factory Resolution
  {
    console.log('  Testing: PlatformAdapterFactory resolution...');
    const githubAdapter = PlatformAdapterFactory.getAdapter(PlatformType.GITHUB);
    assert.strictEqual(githubAdapter.platformName, 'GITHUB');

    const leetcodeAdapter = PlatformAdapterFactory.getAdapter(PlatformType.LEETCODE);
    assert.strictEqual(leetcodeAdapter.platformName, 'LEETCODE');

    const stackOverflowAdapter = PlatformAdapterFactory.getAdapter(PlatformType.STACKOVERFLOW);
    assert.strictEqual(stackOverflowAdapter.platformName, 'STACKOVERFLOW');

    const platforms = PlatformAdapterFactory.getRegisteredPlatforms();
    assert.strictEqual(platforms.length, 11, 'Should have registered all 11 platform connectors');
    console.log('  ✅ Passed: PlatformAdapterFactory resolution (11 connectors registered)');
  }

  // Test Case 2: Project Deduplication
  {
    console.log('  Testing: NormalizationService deduplication...');
    const rawProjects = [
      { title: 'Project Alpha', repoUrl: 'https://github.com/user/alpha' },
      { title: 'project alpha', repoUrl: 'https://github.com/user/alpha' },
      { title: 'Project Beta', repoUrl: 'https://github.com/user/beta' },
    ];
    const deduplicated = NormalizationService.deduplicateProjects(rawProjects);
    assert.strictEqual(deduplicated.length, 2, 'Should remove duplicate repoUrl entries');
    console.log('  ✅ Passed: NormalizationService deduplication');
  }

  // Test Case 3: SyncService Limitation Handling for LinkedIn Without OAuth Token
  {
    console.log(
      '  Testing: LinkedIn sync without OAuth token returns NEEDS_AUTH and no lastSyncedAt...',
    );
    const originalFindBy = IntegrationRepository.findByUserIdAndPlatform;
    const originalUpdate = IntegrationRepository.updateSyncStatus;

    let updatedStatus: string | undefined;
    let updatedLastSyncedAt: Date | undefined;
    let updatedMetadata: Record<string, any> | undefined;

    (IntegrationRepository as any).findByUserIdAndPlatform = async (
      userId: string,
      platform: PlatformType,
    ) => {
      return {
        id: 'mock-int-linkedin-1',
        userId,
        platform,
        username: 'fake_linkedin_handle',
        accessToken: undefined,
        isConnected: true,
        syncStatus: 'IDLE',
        lastSyncedAt: null,
      };
    };

    (IntegrationRepository as any).updateSyncStatus = async (
      id: string,
      status: string,
      lastSyncedAt?: Date,
      metadata?: Record<string, any>,
    ) => {
      updatedStatus = status;
      updatedLastSyncedAt = lastSyncedAt;
      updatedMetadata = metadata;
      return { id, syncStatus: status, lastSyncedAt };
    };

    try {
      const syncResult = await SyncService.syncPlatform('user_123', PlatformType.LINKEDIN);
      assert.strictEqual(
        syncResult.status,
        'NEEDS_AUTH',
        'Sync status must be NEEDS_AUTH when no OAuth token',
      );
      assert.strictEqual(updatedStatus, 'NEEDS_AUTH');
      assert.strictEqual(
        updatedLastSyncedAt,
        undefined,
        'lastSyncedAt must NOT be set for unverified sync',
      );
      assert.ok(syncResult.limitation, 'Limitation message must be returned');
      assert.ok(syncResult.limitation?.includes('OAuth'), 'Limitation message must mention OAuth');
      assert.strictEqual(syncResult.recordsProcessed, 0, 'recordsProcessed must be 0');
      assert.strictEqual(updatedMetadata?.limitation, syncResult.limitation);
      console.log(
        '  ✅ Passed: LinkedIn unauthenticated sync returns NEEDS_AUTH without lastSyncedAt',
      );
    } finally {
      IntegrationRepository.findByUserIdAndPlatform = originalFindBy;
      IntegrationRepository.updateSyncStatus = originalUpdate;
    }
  }

  // Test Case 4: LinkedIn Sync With Valid OAuth Token
  {
    console.log('  Testing: LinkedIn sync with valid OAuth token returns SUCCESS...');
    const originalFindBy = IntegrationRepository.findByUserIdAndPlatform;
    const originalUpdate = IntegrationRepository.updateSyncStatus;
    const originalFetch = global.fetch;

    let updatedStatus: string | undefined;
    let updatedLastSyncedAt: Date | undefined;

    (IntegrationRepository as any).findByUserIdAndPlatform = async (
      userId: string,
      platform: PlatformType,
    ) => {
      return {
        id: 'mock-int-linkedin-2',
        userId,
        platform,
        username: 'verified_linkedin_user',
        accessToken: 'valid_oauth_token',
        isConnected: true,
        syncStatus: 'IDLE',
        lastSyncedAt: null,
      };
    };

    (IntegrationRepository as any).updateSyncStatus = async (
      id: string,
      status: string,
      lastSyncedAt?: Date,
    ) => {
      updatedStatus = status;
      updatedLastSyncedAt = lastSyncedAt;
      return { id, syncStatus: status, lastSyncedAt };
    };

    (global as any).fetch = async (url: string) => {
      if (url.includes('linkedin.com/v2/userinfo')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            sub: 'urn:li:person:abc12345',
            name: 'Verified Engineer',
            headline: 'Senior Cloud Architect',
            email: 'engineer@skilldna.ai',
          }),
        };
      }
      return originalFetch(url);
    };

    try {
      const syncResult = await SyncService.syncPlatform('user_123', PlatformType.LINKEDIN);
      assert.strictEqual(syncResult.status, 'SUCCESS');
      assert.strictEqual(updatedStatus, 'SUCCESS');
      assert.ok(
        updatedLastSyncedAt instanceof Date,
        'lastSyncedAt must be set for verified OAuth sync',
      );
      assert.strictEqual(syncResult.data?.linkedInStats?.headline, 'Senior Cloud Architect');
      console.log(
        '  ✅ Passed: LinkedIn OAuth-authenticated sync returns SUCCESS and updates lastSyncedAt',
      );
    } finally {
      IntegrationRepository.findByUserIdAndPlatform = originalFindBy;
      IntegrationRepository.updateSyncStatus = originalUpdate;
      global.fetch = originalFetch;
    }
  }

  // Test Case 5: Kaggle Limitation Result
  {
    console.log('  Testing: Kaggle sync without credentials returns NEEDS_AUTH...');
    const originalFindBy = IntegrationRepository.findByUserIdAndPlatform;
    const originalUpdate = IntegrationRepository.updateSyncStatus;

    let updatedStatus: string | undefined;
    let updatedLastSyncedAt: Date | undefined;

    (IntegrationRepository as any).findByUserIdAndPlatform = async (
      userId: string,
      platform: PlatformType,
    ) => {
      return {
        id: 'mock-int-kaggle-1',
        userId,
        platform,
        username: 'kaggle_user_sample',
        accessToken: undefined,
        isConnected: true,
        syncStatus: 'IDLE',
      };
    };

    (IntegrationRepository as any).updateSyncStatus = async (
      id: string,
      status: string,
      lastSyncedAt?: Date,
    ) => {
      updatedStatus = status;
      updatedLastSyncedAt = lastSyncedAt;
      return { id, syncStatus: status, lastSyncedAt };
    };

    // Temporarily clear environment Kaggle keys
    const prevKey = process.env.KAGGLE_KEY;
    const prevToken = process.env.KAGGLE_API_TOKEN;
    delete process.env.KAGGLE_KEY;
    delete process.env.KAGGLE_API_TOKEN;

    try {
      const syncResult = await SyncService.syncPlatform('user_123', PlatformType.KAGGLE);
      assert.strictEqual(
        syncResult.status,
        'NEEDS_AUTH',
        'Kaggle without token must yield NEEDS_AUTH',
      );
      assert.strictEqual(updatedStatus, 'NEEDS_AUTH');
      assert.strictEqual(updatedLastSyncedAt, undefined, 'lastSyncedAt must NOT be set');
      assert.ok(syncResult.limitation);
      console.log('  ✅ Passed: Kaggle limitation returns NEEDS_AUTH without setting lastSyncedAt');
    } finally {
      if (prevKey) process.env.KAGGLE_KEY = prevKey;
      if (prevToken) process.env.KAGGLE_API_TOKEN = prevToken;
      IntegrationRepository.findByUserIdAndPlatform = originalFindBy;
      IntegrationRepository.updateSyncStatus = originalUpdate;
    }
  }

  // Test Case 6: Medium Limitation Result
  {
    console.log('  Testing: Medium sync with unavailable RSS feed returns PARTIAL...');
    const originalFindBy = IntegrationRepository.findByUserIdAndPlatform;
    const originalUpdate = IntegrationRepository.updateSyncStatus;
    const originalFetch = global.fetch;

    let updatedStatus: string | undefined;
    let updatedLastSyncedAt: Date | undefined;

    (IntegrationRepository as any).findByUserIdAndPlatform = async (
      userId: string,
      platform: PlatformType,
    ) => {
      return {
        id: 'mock-int-medium-1',
        userId,
        platform,
        username: 'medium_writer_unavailable',
        accessToken: undefined,
        isConnected: true,
        syncStatus: 'IDLE',
      };
    };

    (IntegrationRepository as any).updateSyncStatus = async (
      id: string,
      status: string,
      lastSyncedAt?: Date,
    ) => {
      updatedStatus = status;
      updatedLastSyncedAt = lastSyncedAt;
      return { id, syncStatus: status, lastSyncedAt };
    };

    (global as any).fetch = async (url: string) => {
      if (url.includes('medium.com/feed')) {
        return { ok: false, status: 404, statusText: 'Not Found' };
      }
      return originalFetch(url);
    };

    try {
      const syncResult = await SyncService.syncPlatform('user_123', PlatformType.MEDIUM);
      assert.strictEqual(syncResult.status, 'PARTIAL', 'Medium fallback must yield PARTIAL');
      assert.strictEqual(updatedStatus, 'PARTIAL');
      assert.strictEqual(updatedLastSyncedAt, undefined, 'lastSyncedAt must NOT be set');
      assert.ok(syncResult.limitation);
      console.log('  ✅ Passed: Medium RSS fallback returns PARTIAL without setting lastSyncedAt');
    } finally {
      IntegrationRepository.findByUserIdAndPlatform = originalFindBy;
      IntegrationRepository.updateSyncStatus = originalUpdate;
      global.fetch = originalFetch;
    }
  }

  // Test Case 7: Devpost Limitation Result
  {
    console.log('  Testing: Devpost sync with network fallback returns PARTIAL...');
    const originalFindBy = IntegrationRepository.findByUserIdAndPlatform;
    const originalUpdate = IntegrationRepository.updateSyncStatus;
    const originalFetch = global.fetch;

    let updatedStatus: string | undefined;
    let updatedLastSyncedAt: Date | undefined;

    (IntegrationRepository as any).findByUserIdAndPlatform = async (
      userId: string,
      platform: PlatformType,
    ) => {
      return {
        id: 'mock-int-devpost-1',
        userId,
        platform,
        username: 'devpost_builder_sample',
        accessToken: undefined,
        isConnected: true,
        syncStatus: 'IDLE',
      };
    };

    (IntegrationRepository as any).updateSyncStatus = async (
      id: string,
      status: string,
      lastSyncedAt?: Date,
    ) => {
      updatedStatus = status;
      updatedLastSyncedAt = lastSyncedAt;
      return { id, syncStatus: status, lastSyncedAt };
    };

    (global as any).fetch = async (url: string) => {
      if (url.includes('devpost.com/api')) {
        return { ok: false, status: 500, statusText: 'Internal Server Error' };
      }
      return originalFetch(url);
    };

    try {
      const syncResult = await SyncService.syncPlatform('user_123', PlatformType.DEVPOST);
      assert.strictEqual(syncResult.status, 'PARTIAL', 'Devpost fallback must yield PARTIAL');
      assert.strictEqual(updatedStatus, 'PARTIAL');
      assert.strictEqual(updatedLastSyncedAt, undefined);
      assert.ok(syncResult.limitation);
      console.log('  ✅ Passed: Devpost fallback returns PARTIAL without setting lastSyncedAt');
    } finally {
      IntegrationRepository.findByUserIdAndPlatform = originalFindBy;
      IntegrationRepository.updateSyncStatus = originalUpdate;
      global.fetch = originalFetch;
    }
  }

  // Test Case 8: Existing Successful GitHub Sync Remains SUCCESS
  {
    console.log('  Testing: Successful GitHub sync yields SUCCESS and updates lastSyncedAt...');
    const originalFindBy = IntegrationRepository.findByUserIdAndPlatform;
    const originalUpdate = IntegrationRepository.updateSyncStatus;
    const originalNormalize = NormalizationService.normalizeAndPersist;
    const originalFetch = global.fetch;

    let updatedStatus: string | undefined;
    let updatedLastSyncedAt: Date | undefined;

    (IntegrationRepository as any).findByUserIdAndPlatform = async (
      userId: string,
      platform: PlatformType,
    ) => {
      return {
        id: 'mock-int-github-1',
        userId,
        platform,
        username: 'octocat',
        accessToken: undefined,
        isConnected: true,
        syncStatus: 'IDLE',
      };
    };

    (IntegrationRepository as any).updateSyncStatus = async (
      id: string,
      status: string,
      lastSyncedAt?: Date,
    ) => {
      updatedStatus = status;
      updatedLastSyncedAt = lastSyncedAt;
      return { id, syncStatus: status, lastSyncedAt };
    };

    (NormalizationService as any).normalizeAndPersist = async () => {
      return {
        success: true,
        userId: 'user_123',
        platform: PlatformType.GITHUB,
        recordsProcessed: { githubStatsSaved: true, codingStatsSaved: false, projectsSaved: 1 },
        normalizedAt: new Date().toISOString(),
      };
    };

    (global as any).fetch = async (url: string) => {
      if (url.includes('api.github.com/users/octocat/repos')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              name: 'Spoon-Knife',
              description: 'Sample repo',
              html_url: 'https://github.com/octocat/Spoon-Knife',
              stargazers_count: 50,
              forks_count: 10,
              language: 'JavaScript',
            },
          ],
        };
      }
      if (url.includes('api.github.com/users/octocat')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 583231,
            login: 'octocat',
            public_repos: 8,
            public_gists: 8,
          }),
        };
      }
      return originalFetch(url);
    };

    try {
      const syncResult = await SyncService.syncPlatform('user_123', PlatformType.GITHUB);
      assert.strictEqual(syncResult.status, 'SUCCESS');
      assert.strictEqual(updatedStatus, 'SUCCESS');
      assert.ok(updatedLastSyncedAt instanceof Date);
      console.log('  ✅ Passed: Successful GitHub sync remains SUCCESS');
    } finally {
      IntegrationRepository.findByUserIdAndPlatform = originalFindBy;
      IntegrationRepository.updateSyncStatus = originalUpdate;
      NormalizationService.normalizeAndPersist = originalNormalize;
      global.fetch = originalFetch;
    }
  }

  // Test Case 9: Existing Successful LeetCode Sync Remains SUCCESS
  {
    console.log('  Testing: Successful LeetCode sync yields SUCCESS and updates lastSyncedAt...');
    const originalFindBy = IntegrationRepository.findByUserIdAndPlatform;
    const originalUpdate = IntegrationRepository.updateSyncStatus;
    const originalNormalize = NormalizationService.normalizeAndPersist;
    const originalFetch = global.fetch;

    let updatedStatus: string | undefined;
    let updatedLastSyncedAt: Date | undefined;

    (IntegrationRepository as any).findByUserIdAndPlatform = async (
      userId: string,
      platform: PlatformType,
    ) => {
      return {
        id: 'mock-int-leetcode-1',
        userId,
        platform,
        username: 'neetcode',
        accessToken: undefined,
        isConnected: true,
        syncStatus: 'IDLE',
      };
    };

    (IntegrationRepository as any).updateSyncStatus = async (
      id: string,
      status: string,
      lastSyncedAt?: Date,
    ) => {
      updatedStatus = status;
      updatedLastSyncedAt = lastSyncedAt;
      return { id, syncStatus: status, lastSyncedAt };
    };

    (NormalizationService as any).normalizeAndPersist = async () => {
      return {
        success: true,
        userId: 'user_123',
        platform: PlatformType.LEETCODE,
        recordsProcessed: { githubStatsSaved: false, codingStatsSaved: true, projectsSaved: 0 },
        normalizedAt: new Date().toISOString(),
      };
    };

    (global as any).fetch = async (url: string) => {
      if (url.includes('leetcode.com/graphql')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              matchedUser: {
                username: 'neetcode',
                profile: { ranking: 1250, reputation: 500 },
                badges: [],
                submitStats: {
                  acSubmissionNum: [
                    { difficulty: 'All', count: 450 },
                    { difficulty: 'Easy', count: 150 },
                    { difficulty: 'Medium', count: 200 },
                    { difficulty: 'Hard', count: 100 },
                  ],
                },
              },
            },
          }),
        };
      }
      return originalFetch(url);
    };

    try {
      const syncResult = await SyncService.syncPlatform('user_123', PlatformType.LEETCODE);
      assert.strictEqual(syncResult.status, 'SUCCESS');
      assert.strictEqual(updatedStatus, 'SUCCESS');
      assert.ok(updatedLastSyncedAt instanceof Date);
      console.log('  ✅ Passed: Successful LeetCode sync remains SUCCESS');
    } finally {
      IntegrationRepository.findByUserIdAndPlatform = originalFindBy;
      IntegrationRepository.updateSyncStatus = originalUpdate;
      NormalizationService.normalizeAndPersist = originalNormalize;
      global.fetch = originalFetch;
    }
  }

  // Test Case 10: Existing Successful AtCoder Sync Remains SUCCESS
  {
    console.log('  Testing: Successful AtCoder sync yields SUCCESS and updates lastSyncedAt...');
    const originalFindBy = IntegrationRepository.findByUserIdAndPlatform;
    const originalUpdate = IntegrationRepository.updateSyncStatus;
    const originalNormalize = NormalizationService.normalizeAndPersist;
    const originalFetch = global.fetch;

    let updatedStatus: string | undefined;
    let updatedLastSyncedAt: Date | undefined;

    (IntegrationRepository as any).findByUserIdAndPlatform = async (
      userId: string,
      platform: PlatformType,
    ) => {
      return {
        id: 'mock-int-atcoder-1',
        userId,
        platform,
        username: 'Parmesh',
        accessToken: undefined,
        isConnected: true,
        syncStatus: 'IDLE',
      };
    };

    (IntegrationRepository as any).updateSyncStatus = async (
      id: string,
      status: string,
      lastSyncedAt?: Date,
    ) => {
      updatedStatus = status;
      updatedLastSyncedAt = lastSyncedAt;
      return { id, syncStatus: status, lastSyncedAt };
    };

    (NormalizationService as any).normalizeAndPersist = async () => {
      return {
        success: true,
        userId: 'user_123',
        platform: PlatformType.ATCODER,
        recordsProcessed: { githubStatsSaved: false, codingStatsSaved: true, projectsSaved: 0 },
        normalizedAt: new Date().toISOString(),
      };
    };

    (global as any).fetch = async (url: string) => {
      if (url.includes('atcoder-api/v3/user_info')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            user_id: 'Parmesh',
            accepted_count: 85,
            accepted_count_rank: 1200,
            rated_point_sum: 25000,
            rated_point_sum_rank: 950,
          }),
        };
      }
      if (url.includes('history/json')) {
        return {
          ok: true,
          status: 200,
          json: async () => [{ NewRating: 1450 }],
        };
      }
      return originalFetch(url);
    };

    try {
      const syncResult = await SyncService.syncPlatform('user_123', PlatformType.ATCODER);
      assert.strictEqual(syncResult.status, 'SUCCESS');
      assert.strictEqual(updatedStatus, 'SUCCESS');
      assert.ok(updatedLastSyncedAt instanceof Date);
      console.log('  ✅ Passed: Successful AtCoder sync remains SUCCESS');
    } finally {
      IntegrationRepository.findByUserIdAndPlatform = originalFindBy;
      IntegrationRepository.updateSyncStatus = originalUpdate;
      NormalizationService.normalizeAndPersist = originalNormalize;
      global.fetch = originalFetch;
    }
  }

  // Test Case 11: Failed Sync Remains FAILED
  {
    console.log('  Testing: Nonexistent user sync fails and sets status FAILED...');
    const originalFindBy = IntegrationRepository.findByUserIdAndPlatform;
    const originalUpdate = IntegrationRepository.updateSyncStatus;
    const originalFetch = global.fetch;

    let updatedStatus: string | undefined;

    (IntegrationRepository as any).findByUserIdAndPlatform = async (
      userId: string,
      platform: PlatformType,
    ) => {
      return {
        id: 'mock-int-codeforces-failed',
        userId,
        platform,
        username: 'nonexistent_user_99999',
        accessToken: undefined,
        isConnected: true,
        syncStatus: 'IDLE',
      };
    };

    (IntegrationRepository as any).updateSyncStatus = async (id: string, status: string) => {
      updatedStatus = status;
      return { id, syncStatus: status };
    };

    (global as any).fetch = async (url: string) => {
      if (url.includes('codeforces.com/api')) {
        return {
          ok: false,
          status: 400,
          json: async () => ({ status: 'FAILED', comment: 'handle not found' }),
        };
      }
      return originalFetch(url);
    };

    try {
      const syncResult = await SyncService.syncPlatform('user_123', PlatformType.CODEFORCES, {
        maxRetries: 0,
      });
      assert.strictEqual(syncResult.status, 'FAILED');
      assert.strictEqual(updatedStatus, 'FAILED');
      assert.ok(syncResult.error);
      console.log('  ✅ Passed: Failed sync correctly records FAILED status');
    } finally {
      IntegrationRepository.findByUserIdAndPlatform = originalFindBy;
      IntegrationRepository.updateSyncStatus = originalUpdate;
      global.fetch = originalFetch;
    }
  }

  // Test Case 12: GitHub 403 Rate Limit Handling in SyncService
  {
    console.log('  Testing: GitHub 403 rate limit handling in SyncService...');
    const originalFindBy = IntegrationRepository.findByUserIdAndPlatform;
    const originalUpdate = IntegrationRepository.updateSyncStatus;
    const originalFetch = global.fetch;

    let updatedStatus: string | undefined;
    let updatedLastSyncedAt: Date | undefined;
    let updatedMetadata: Record<string, any> | undefined;
    let fetchCount = 0;

    (IntegrationRepository as any).findByUserIdAndPlatform = async (
      userId: string,
      platform: PlatformType,
    ) => {
      return {
        id: 'mock-int-github-rate-limited',
        userId,
        platform,
        username: 'octocat',
        accessToken: undefined,
        isConnected: true,
        syncStatus: 'IDLE',
      };
    };

    (IntegrationRepository as any).updateSyncStatus = async (
      id: string,
      status: string,
      lastSyncedAt?: Date,
      metadata?: Record<string, any>,
    ) => {
      updatedStatus = status;
      updatedLastSyncedAt = lastSyncedAt;
      updatedMetadata = metadata;
      return { id, syncStatus: status, lastSyncedAt, metadata };
    };

    const resetSec = Math.floor(Date.now() / 1000) + 1200;

    (global as any).fetch = async (url: string) => {
      fetchCount++;
      if (url.includes('api.github.com/users/octocat')) {
        return {
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          headers: new Headers({
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(resetSec),
          }),
          json: async () => ({ message: 'API rate limit exceeded for IP' }),
        };
      }
      return originalFetch(url);
    };

    try {
      const syncResult = await SyncService.syncPlatform('user_123', PlatformType.GITHUB, {
        maxRetries: 3,
      });
      assert.strictEqual(syncResult.status, 'RATE_LIMITED');
      assert.strictEqual(updatedStatus, 'RATE_LIMITED');
      assert.strictEqual(
        updatedLastSyncedAt,
        undefined,
        'lastSyncedAt must NOT be set on RATE_LIMITED',
      );
      assert.strictEqual(
        fetchCount,
        1,
        'SyncService must NOT enter retry loop on RateLimitExceededError',
      );
      assert.ok(updatedMetadata?.rateLimitResetAt, 'rateLimitResetAt must be recorded in metadata');
      assert.ok(
        typeof updatedMetadata?.retryAfterSeconds === 'number' &&
          updatedMetadata.retryAfterSeconds > 0,
        'retryAfterSeconds must be recorded in metadata',
      );
      console.log(
        '  ✅ Passed: GitHub 403 rate limit sets RATE_LIMITED without retrying or updating lastSyncedAt',
      );
    } finally {
      IntegrationRepository.findByUserIdAndPlatform = originalFindBy;
      IntegrationRepository.updateSyncStatus = originalUpdate;
      global.fetch = originalFetch;
    }
  }

  console.log('🎉 All Synchronization & Normalization Tests Passed Successfully!');
}

runSyncTests().catch((err) => {
  console.error('❌ Sync Test Failed:', err);
  process.exit(1);
});
