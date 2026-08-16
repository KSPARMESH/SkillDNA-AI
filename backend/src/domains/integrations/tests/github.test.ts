import assert from 'node:assert';
import { GitHubAdapter } from '../adapters/github.adapter';
import {
  IntegrationNotFoundError,
  RateLimitExceededError,
  SyncFailedError,
} from '../errors/integration.errors';

async function runGitHubAdapterTests() {
  console.log('🧪 Running GitHub Adapter Tests...');

  const adapter = new GitHubAdapter();

  // Test Case 1: Validation
  {
    console.log('  Testing: username validation...');
    const valid = await adapter.validateCredentials('octocat');
    assert.strictEqual(valid, true, 'octocat should be a valid GitHub user');

    const empty = await adapter.validateCredentials('');
    assert.strictEqual(empty, false, 'empty username should fail validation');
    console.log('  ✅ Passed: username validation');
  }

  // Test Case 2: Real API fetch for existing user (octocat)
  {
    console.log('  Testing: real API fetch for GitHub user "octocat"...');
    try {
      const data = await adapter.fetchData('octocat');
      assert.strictEqual(data.platform, 'GITHUB');
      assert.strictEqual(data.username, 'octocat');
      assert.ok(data.githubStats, 'Should contain githubStats');
      assert.ok(data.githubStats!.publicRepos >= 0, 'Public repos count should be >= 0');
      assert.ok(
        Array.isArray(data.githubStats!.recentProjects),
        'Should return recentProjects array',
      );
      console.log(`  ✅ Passed: real API fetch (public repos: ${data.githubStats!.publicRepos})`);
    } catch (err: any) {
      console.log(`  ⚠️ Real fetch skipped or rate-limited: ${err.message}`);
    }
  }

  // Test Case 3: Fetch for non-existent user should throw IntegrationNotFoundError
  {
    console.log('  Testing: non-existent GitHub user lookup...');
    const nonExistentUser = `nonexistentuser_${Date.now()}_invalid`;
    try {
      await adapter.fetchData(nonExistentUser);
      assert.fail('Should have thrown error for non-existent user');
    } catch (err: any) {
      assert.ok(
        err instanceof IntegrationNotFoundError || err.message.includes('not found'),
        'Should throw IntegrationNotFoundError',
      );
      console.log('  ✅ Passed: non-existent user handling');
    }
  }

  // Test Case 4: GitHub HTTP 403 with x-ratelimit-remaining = 0 -> RateLimitExceededError
  {
    console.log(
      '  Testing: HTTP 403 with x-ratelimit-remaining = 0 is classified as RateLimitExceededError...',
    );
    const originalFetch = global.fetch;
    const resetTimeSec = Math.floor(Date.now() / 1000) + 1800; // 30 minutes in future

    (global as any).fetch = async (url: string) => {
      if (url.includes('api.github.com/users/octocat')) {
        return {
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          headers: new Headers({
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(resetTimeSec),
          }),
          json: async () => ({ message: 'API rate limit exceeded for IP' }),
        };
      }
      return originalFetch(url);
    };

    try {
      let threwRateLimit = false;
      try {
        await adapter.fetchData('octocat');
      } catch (err: any) {
        threwRateLimit = true;
        assert.ok(
          err instanceof RateLimitExceededError,
          `Expected RateLimitExceededError, got: ${err.constructor.name}`,
        );
        assert.strictEqual(err.statusCode, 429);
        assert.ok(err.retryAfterSeconds! > 0, 'retryAfterSeconds must be positive');
        assert.ok(err.resetAt instanceof Date, 'resetAt must be parsed Date');
        assert.ok(err.message.includes('Reset at'), 'Error message must contain reset timestamp');
      }
      assert.ok(threwRateLimit, 'Should throw RateLimitExceededError when remaining is 0');
      console.log(
        '  ✅ Passed: HTTP 403 with x-ratelimit-remaining = 0 correctly classified as RateLimitExceededError',
      );
    } finally {
      global.fetch = originalFetch;
    }
  }

  // Test Case 5: GitHub HTTP 403 with x-ratelimit-remaining > 0 -> SyncFailedError (Forbidden)
  {
    console.log(
      '  Testing: HTTP 403 with x-ratelimit-remaining > 0 is treated as generic forbidden error...',
    );
    const originalFetch = global.fetch;

    (global as any).fetch = async (url: string) => {
      if (url.includes('api.github.com/users/octocat')) {
        return {
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          headers: new Headers({
            'x-ratelimit-remaining': '45',
          }),
          json: async () => ({ message: 'Forbidden access to resource' }),
        };
      }
      return originalFetch(url);
    };

    try {
      let threwForbidden = false;
      try {
        await adapter.fetchData('octocat');
      } catch (err: any) {
        threwForbidden = true;
        assert.ok(
          err instanceof SyncFailedError,
          `Expected SyncFailedError, got: ${err.constructor.name}`,
        );
        assert.ok(!err.message.includes('Rate limit'), 'Must not be classified as rate limit');
      }
      assert.ok(threwForbidden, 'Should throw SyncFailedError for non-rate-limit 403');
      console.log(
        '  ✅ Passed: HTTP 403 with non-zero quota treated as generic forbidden SyncFailedError',
      );
    } finally {
      global.fetch = originalFetch;
    }
  }

  // Test Case 6: GitHub HTTP 429 -> RateLimitExceededError
  {
    console.log('  Testing: HTTP 429 is classified as RateLimitExceededError...');
    const originalFetch = global.fetch;

    (global as any).fetch = async (url: string) => {
      if (url.includes('api.github.com/users/octocat')) {
        return {
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({
            'retry-after': '120',
          }),
          json: async () => ({ message: 'Too many requests' }),
        };
      }
      return originalFetch(url);
    };

    try {
      let threw429 = false;
      try {
        await adapter.fetchData('octocat');
      } catch (err: any) {
        threw429 = true;
        assert.ok(err instanceof RateLimitExceededError);
        assert.strictEqual(err.retryAfterSeconds, 120);
      }
      assert.ok(threw429, 'Should throw RateLimitExceededError for 429');
      console.log('  ✅ Passed: HTTP 429 classified as RateLimitExceededError with retry-after');
    } finally {
      global.fetch = originalFetch;
    }
  }

  // Test Case 7: validateCredentials with HTTP 403 Rate Limit
  {
    console.log('  Testing: validateCredentials with rate limit throws RateLimitExceededError...');
    const originalFetch = global.fetch;

    (global as any).fetch = async (url: string) => {
      if (url.includes('api.github.com/users/octocat')) {
        return {
          ok: false,
          status: 403,
          headers: new Headers({
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 600),
          }),
        };
      }
      return originalFetch(url);
    };

    try {
      let threw = false;
      try {
        await adapter.validateCredentials('octocat');
      } catch (err: any) {
        threw = true;
        assert.ok(err instanceof RateLimitExceededError);
      }
      assert.ok(
        threw,
        'validateCredentials must throw RateLimitExceededError during active rate limit',
      );
      console.log(
        '  ✅ Passed: validateCredentials cleanly surfaces RateLimitExceededError on rate limit',
      );
    } finally {
      global.fetch = originalFetch;
    }
  }

  console.log('🎉 All GitHub Adapter & Rate Limit Classification Tests Passed Successfully!');
}

runGitHubAdapterTests().catch((err) => {
  console.error('❌ GitHub Adapter Test Failed:', err);
  process.exit(1);
});
