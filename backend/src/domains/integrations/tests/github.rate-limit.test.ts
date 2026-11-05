import assert from 'node:assert/strict';
import { GitHubAdapter } from '../adapters/github.adapter';
import { RateLimitExceededError } from '../errors/integration.errors';

const adapter = new GitHubAdapter();
const originalFetch = global.fetch;

function mockRateLimitedResponse(status: number, headers: Record<string, string>) {
  (global as any).fetch = async () => ({
    ok: false,
    status,
    statusText: status === 429 ? 'Too Many Requests' : 'Forbidden',
    headers: new Headers(headers),
  });
}

async function getRateLimitError(): Promise<RateLimitExceededError> {
  try {
    await adapter.fetchData('octocat');
  } catch (error) {
    assert.ok(error instanceof RateLimitExceededError);
    return error;
  }
  assert.fail('Expected a rate limit error');
}

async function runGitHubRateLimitTests() {
  try {
    // 403 is rate limited only when the remaining quota is exhausted.
    mockRateLimitedResponse(403, {
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 120),
    });
    const forbidden = await getRateLimitError();
    assert.ok(forbidden.retryAfterSeconds! > 0);
    assert.ok(forbidden.resetAt!.getTime() > Date.now());

    // A valid Retry-After takes precedence over the reset header.
    mockRateLimitedResponse(429, {
      'retry-after': '120',
      'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 600),
    });
    const retryAfter = await getRateLimitError();
    assert.equal(retryAfter.retryAfterSeconds, 120);
    assert.ok(retryAfter.resetAt!.getTime() < Date.now() + 600_000);

    // A future Unix epoch reset supplies a positive delay and future reset time.
    const futureReset = Math.floor(Date.now() / 1000) + 180;
    mockRateLimitedResponse(429, { 'x-ratelimit-reset': String(futureReset) });
    const future = await getRateLimitError();
    assert.equal(future.resetAt!.getTime(), futureReset * 1000);
    assert.ok(future.retryAfterSeconds! > 0);

    // An expired reset is ignored, including in the formatted message.
    mockRateLimitedResponse(429, {
      'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) - 60),
    });
    const expired = await getRateLimitError();
    assert.equal(expired.resetAt, undefined);
    assert.equal(expired.retryAfterSeconds, undefined);
    assert.ok(!expired.message.includes('Reset at'));

    // Malformed and missing reset headers still classify 429 without bad delays.
    const invalidOrMissingResetHeaders: Array<Record<string, string>> = [
      { 'x-ratelimit-reset': 'not-a-timestamp' },
      {},
    ];
    for (const headers of invalidOrMissingResetHeaders) {
      mockRateLimitedResponse(429, headers);
      const invalidOrMissing = await getRateLimitError();
      assert.equal(invalidOrMissing.resetAt, undefined);
      assert.equal(invalidOrMissing.retryAfterSeconds, undefined);
    }

    console.log('GitHub rate-limit reset tests passed (5 scenarios).');
  } finally {
    global.fetch = originalFetch;
  }
}

runGitHubRateLimitTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
