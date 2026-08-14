import assert from 'node:assert';
import { AtCoderAdapter } from '../adapters/atcoder.adapter';
import { PlatformType } from '@skilldna/shared';
import { IntegrationNotFoundError, SyncFailedError } from '../errors/integration.errors';

async function runAtCoderAdapterTests() {
  console.log('🧪 Running Comprehensive AtCoder Adapter & Diagnostics Test Suite...');

  const adapter = new AtCoderAdapter();

  // Test Case 1: Valid user 'Parmesh' live synchronization & normalization
  {
    console.log('  1. Testing live profile fetch & normalization for valid user "Parmesh"...');
    const result = await adapter.fetchData('Parmesh');

    assert.strictEqual(result.platform, PlatformType.ATCODER);
    assert.strictEqual(result.username, 'Parmesh');
    assert.ok(result.codingStats, 'codingStats should be present');
    assert.ok(result.rawMetadata, 'rawMetadata should be present');

    const codingStats = result.codingStats!;
    assert.ok(typeof codingStats.totalSolved === 'number');
    assert.ok(codingStats.totalSolved > 0, 'Parmesh should have solved problems');
    assert.strictEqual(
      codingStats.easySolved + codingStats.mediumSolved + codingStats.hardSolved,
      codingStats.totalSolved,
    );
    assert.ok(result.rawMetadata!.acceptedCount !== undefined);
    assert.ok(result.rawMetadata!.ratedPointSum !== undefined);
    assert.ok(typeof codingStats.contestRating === 'number');
    console.log(
      `     ✓ Successfully fetched Parmesh: ${codingStats.totalSolved} solved, rating: ${codingStats.contestRating}`,
    );
  }

  // Test Case 2: Credential validation for 'Parmesh' and 'chokudai'
  {
    console.log('  2. Testing validateCredentials for valid handles...');
    const parmeshValid = await adapter.validateCredentials('Parmesh');
    assert.strictEqual(parmeshValid, true, 'Parmesh should be valid');

    const chokudaiValid = await adapter.validateCredentials('chokudai');
    assert.strictEqual(chokudaiValid, true, 'chokudai should be valid');
    console.log('     ✓ Credential validation confirmed for verified users');
  }

  // Test Case 3: Unknown / Nonexistent AtCoder username
  {
    console.log('  3. Testing unknown/nonexistent AtCoder username handling...');
    const fakeUser = 'nonexistent_user_xyz_999999999';
    const fakeValid = await adapter.validateCredentials(fakeUser);
    assert.strictEqual(fakeValid, false, 'Nonexistent user should fail credential validation');

    let threwExpected = false;
    try {
      await adapter.fetchData(fakeUser);
    } catch (err: any) {
      threwExpected = true;
      assert.ok(
        err instanceof IntegrationNotFoundError,
        `Expected IntegrationNotFoundError but received ${err.constructor.name}: ${err.message}`,
      );
      assert.strictEqual(err.statusCode, 404);
    }
    assert.ok(threwExpected, 'fetchData for non-existent user must throw IntegrationNotFoundError');
    console.log('     ✓ Nonexistent user correctly threw IntegrationNotFoundError (HTTP 404)');
  }

  // Test Case 4: Mocked External 404 Handling
  {
    console.log('  4. Testing external API HTTP 404 handling via mock...');
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      if (url.includes('atcoder')) {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({}),
        };
      }
      return originalFetch(url);
    };

    try {
      let threw404 = false;
      try {
        await adapter.fetchData('some_user');
      } catch (err: any) {
        threw404 = true;
        assert.ok(err instanceof IntegrationNotFoundError);
        assert.strictEqual(err.statusCode, 404);
      }
      assert.ok(threw404, 'External 404 must trigger IntegrationNotFoundError');
      console.log('     ✓ External HTTP 404 cleanly mapped to IntegrationNotFoundError');
    } finally {
      global.fetch = originalFetch;
    }
  }

  // Test Case 5: Mocked Malformed / Invalid External Response Handling
  {
    console.log('  5. Testing malformed external JSON response handling...');
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      if (url.includes('user_info')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => {
            throw new Error('Unexpected token < in JSON');
          },
        };
      }
      return originalFetch(url);
    };

    try {
      let threwMalformed = false;
      try {
        await adapter.fetchData('Parmesh');
      } catch (err: any) {
        threwMalformed = true;
        assert.ok(err instanceof SyncFailedError);
        assert.ok(err.message.includes('Malformed JSON response'));
      }
      assert.ok(threwMalformed, 'Malformed response must trigger SyncFailedError');
      console.log('     ✓ Malformed JSON safely caught as SyncFailedError');
    } finally {
      global.fetch = originalFetch;
    }
  }

  // Test Case 6: Mocked Server 500 / 503 External Error
  {
    console.log('  6. Testing server 500/503 error handling...');
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      if (url.includes('user_info')) {
        return {
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: async () => ({}),
        };
      }
      return originalFetch(url);
    };

    try {
      let threw503 = false;
      try {
        await adapter.fetchData('Parmesh');
      } catch (err: any) {
        threw503 = true;
        assert.ok(err instanceof SyncFailedError);
        assert.ok(err.message.includes('AtCoder API error 503'));
      }
      assert.ok(threw503, '503 error must trigger SyncFailedError');
      console.log('     ✓ Server 503 safely caught as SyncFailedError');
    } finally {
      global.fetch = originalFetch;
    }
  }

  console.log('🎉 All AtCoder Adapter Diagnostic & Error Handling Tests Passed Successfully!');
}

runAtCoderAdapterTests().catch((err) => {
  console.error('❌ AtCoder Adapter Test Failed:', err);
  process.exit(1);
});
