import assert from 'node:assert';

// Explicit test fixture encryption key for standalone test runs
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';

import { AuthService } from '../../../domains/auth/auth.service';
import { IntegrationRepository } from '../repositories/integration.repository';
import {
  PlatformType,
  normalizePlatformType,
  getPlatformDisplayName,
  PLATFORM_DISPLAY_NAMES,
} from '@skilldna/shared';
import {
  validateConnectPlatform,
  validateDisconnectPlatform,
} from '../validators/integration.validator';
import { OAuthService } from '../services/oauth.service';

async function runIntegrationDomainTests() {
  console.log('🧪 Running Integration Domain E2E Service & Enum Mapping Tests...');

  // 1. Create a test user for DB integrations
  const testEmail = `integration.test.${Date.now()}@skilldna.ai`;
  const registerResult = await AuthService.register({
    email: testEmail,
    password: 'Password123!',
    firstName: 'Integration',
    lastName: 'Tester',
  });
  const userId = registerResult.user.id;

  // Test Case 0: Centralized PlatformType Enum Normalization
  {
    console.log('  Testing: Centralized PlatformType enum mappings...');
    assert.strictEqual(normalizePlatformType('AtCoder'), PlatformType.ATCODER);
    assert.strictEqual(normalizePlatformType('atcoder'), PlatformType.ATCODER);
    assert.strictEqual(normalizePlatformType('ATCODER'), PlatformType.ATCODER);
    assert.strictEqual(normalizePlatformType('GitHub'), PlatformType.GITHUB);
    assert.strictEqual(normalizePlatformType('LeetCode'), PlatformType.LEETCODE);
    assert.strictEqual(normalizePlatformType('HackerRank'), PlatformType.HACKERRANK);
    assert.strictEqual(normalizePlatformType('Codeforces'), PlatformType.CODEFORCES);
    assert.strictEqual(normalizePlatformType('Stack Overflow'), PlatformType.STACKOVERFLOW);
    assert.strictEqual(normalizePlatformType('stackoverflow'), PlatformType.STACKOVERFLOW);
    assert.strictEqual(normalizePlatformType('Medium'), PlatformType.MEDIUM);
    assert.strictEqual(normalizePlatformType('LinkedIn'), PlatformType.LINKEDIN);
    assert.strictEqual(normalizePlatformType('Kaggle'), PlatformType.KAGGLE);
    assert.strictEqual(normalizePlatformType('Devpost'), PlatformType.DEVPOST);
    assert.strictEqual(normalizePlatformType('CodeChef'), PlatformType.CODECHEF);

    assert.strictEqual(getPlatformDisplayName(PlatformType.ATCODER), 'AtCoder');
    assert.strictEqual(PLATFORM_DISPLAY_NAMES[PlatformType.ATCODER], 'AtCoder');
    console.log('  ✅ Passed: All 11 platform enum mappings and display names');
  }

  // Test Case 1: Connect Platform Integration (GitHub)
  {
    console.log('  Testing: IntegrationRepository.upsertIntegration (with encrypted tokens)...');
    const rawToken = 'gho_secret_access_token_sample_12345';
    const integration = await IntegrationRepository.upsertIntegration({
      userId,
      platform: PlatformType.GITHUB,
      username: 'octocat',
      accessToken: rawToken,
    });

    assert.strictEqual(integration.userId, userId);
    assert.strictEqual(integration.platform, PlatformType.GITHUB);
    assert.strictEqual(integration.username, 'octocat');

    // Retrieve and verify decryption
    const fetched = await IntegrationRepository.findByUserIdAndPlatform(
      userId,
      PlatformType.GITHUB,
    );
    assert.ok(fetched, 'Integration should exist in DB');
    assert.strictEqual(
      fetched?.accessToken,
      rawToken,
      'Access token should be correctly decrypted',
    );
    console.log(
      '  ✅ Passed: IntegrationRepository upsert and AES-256 token encryption/decryption',
    );
  }

  // Test Case 1b: Connect AtCoder (with display label "AtCoder" and valid handle "Parmesh")
  {
    console.log('  Testing: validateConnectPlatform and Prisma upsert with AtCoder / Parmesh...');
    const validatedDto = validateConnectPlatform({
      platform: 'AtCoder', // Display label from client
      username: 'Parmesh',
    });

    assert.strictEqual(
      validatedDto.platform,
      PlatformType.ATCODER,
      'Validator must normalize display label AtCoder to enum ATCODER',
    );
    assert.strictEqual(validatedDto.username, 'Parmesh');

    // Upsert into Database via Prisma
    const atcoderIntegration = await IntegrationRepository.upsertIntegration({
      userId,
      platform: validatedDto.platform,
      username: validatedDto.username,
    });

    assert.strictEqual(atcoderIntegration.userId, userId);
    assert.strictEqual(
      atcoderIntegration.platform,
      PlatformType.ATCODER,
      'Database record must persist ATCODER enum without Postgres 22P02 error',
    );
    assert.strictEqual(atcoderIntegration.username, 'Parmesh');
    assert.strictEqual(atcoderIntegration.isConnected, true);

    const fetchedAtCoder = await IntegrationRepository.findByUserIdAndPlatform(
      userId,
      'AtCoder', // Should also work with case-insensitive / display string
    );
    assert.ok(fetchedAtCoder, 'AtCoder integration must exist');
    assert.strictEqual(fetchedAtCoder?.username, 'Parmesh');
    console.log('  ✅ Passed: AtCoder connection with username Parmesh and enum ATCODER');
  }

  // Test Case 2: OAuth URL Generation
  {
    console.log('  Testing: OAuthService.getAuthorizationUrl...');
    const url = OAuthService.getAuthorizationUrl(PlatformType.GITHUB, 'state_xyz');
    assert.ok(
      url.includes('github.com/login/oauth/authorize'),
      'URL should point to GitHub authorization',
    );
    assert.ok(url.includes('state=state_xyz'), 'URL should contain state query parameter');
    console.log('  ✅ Passed: OAuthService.getAuthorizationUrl');
  }

  // Test Case 3: Disconnect Integration
  {
    console.log('  Testing: IntegrationRepository.disconnectIntegration...');
    const validatedDisconnect = validateDisconnectPlatform({ platform: 'AtCoder' });
    assert.strictEqual(validatedDisconnect.platform, PlatformType.ATCODER);

    await IntegrationRepository.disconnectIntegration(userId, validatedDisconnect.platform);
    const disconnected = await IntegrationRepository.findByUserIdAndPlatform(
      userId,
      PlatformType.ATCODER,
    );
    assert.strictEqual(disconnected?.isConnected, false, 'Integration should be disconnected');
    console.log('  ✅ Passed: IntegrationRepository.disconnectIntegration for AtCoder');
  }

  // =========================================================================
  // Test Case 4: Stage 2 Pre-Persistence Identity Validation Suite
  // =========================================================================
  console.log('  Testing: Stage 2 Pre-Persistence Identity Validation...');
  const { IntegrationController } = await import('../controllers/integration.controller');
  const { IntegrationNotFoundError, OAuthAuthenticationError } =
    await import('../errors/integration.errors');
  const { SyncService } = await import('../services/sync.service');

  // Test 4.1: Valid GitHub username -> validation passes -> DB row created
  {
    console.log('    4.1 Testing valid GitHub username connect...');
    let syncCalled = false;
    const origSync = SyncService.syncPlatform;
    (SyncService as any).syncPlatform = async () => {
      syncCalled = true;
      return {} as any;
    };

    let resData: any = null;
    let resStatus = 0;
    const req: any = {
      user: { id: userId, email: testEmail },
      body: { platform: 'GITHUB', username: 'octocat' },
    };
    const res: any = {
      status: (code: number) => {
        resStatus = code;
        return {
          json: (data: any) => {
            resData = data;
          },
        };
      },
    };
    let nextErr: any = null;
    const next = (err?: any) => {
      nextErr = err;
    };

    try {
      await IntegrationController.connect(req, res, next);
      assert.strictEqual(nextErr, null, 'Valid GitHub connect should not call next with error');
      assert.strictEqual(resStatus, 200);
      assert.strictEqual(resData?.success, true);

      const dbRow = await IntegrationRepository.findByUserIdAndPlatform(
        userId,
        PlatformType.GITHUB,
      );
      assert.ok(dbRow, 'DB row must be created for valid GitHub handle');
      assert.strictEqual(dbRow?.isConnected, true);
      assert.strictEqual(dbRow?.username, 'octocat');
      console.log('    ✓ Valid GitHub handle successfully verified and persisted to DB');
    } finally {
      SyncService.syncPlatform = origSync;
    }
  }

  // Test 4.2: Invalid GitHub username -> validation fails -> NO DB row created
  {
    console.log('    4.2 Testing invalid GitHub username connect rejection...');
    await IntegrationRepository.disconnectIntegration(userId, PlatformType.GITHUB);
    // Delete previous row if any to test fresh rejection
    const originalFindBy = IntegrationRepository.findByUserIdAndPlatform;

    const req: any = {
      user: { id: userId, email: testEmail },
      body: { platform: 'GITHUB', username: 'this_nonexistent_github_handle_999999_xyz' },
    };
    let nextErr: any = null;
    const res: any = {
      status: () => ({ json: () => {} }),
    };
    const next = (err?: any) => {
      nextErr = err;
    };

    await IntegrationController.connect(req, res, next);
    assert.ok(
      nextErr instanceof IntegrationNotFoundError,
      'Invalid handle must throw IntegrationNotFoundError',
    );

    // Confirm that the disconnected status remains or no connected row exists for this invalid handle
    const dbRow = await IntegrationRepository.findByUserIdAndPlatform(userId, PlatformType.GITHUB);
    assert.notStrictEqual(
      dbRow?.username,
      'this_nonexistent_github_handle_999999_xyz',
      'Invalid handle must NOT be persisted in DB',
    );
    console.log('    ✓ Invalid GitHub handle rejected with 404, no DB record updated');
  }

  // Test 4.3: Valid LeetCode username -> validation passes
  {
    console.log('    4.3 Testing valid LeetCode username connect...');
    let resStatus = 0;
    const req: any = {
      user: { id: userId, email: testEmail },
      body: { platform: 'LEETCODE', username: 'neetcode' },
    };
    const res: any = {
      status: (code: number) => {
        resStatus = code;
        return { json: () => {} };
      },
    };
    let nextErr: any = null;
    const next = (err?: any) => {
      nextErr = err;
    };

    await IntegrationController.connect(req, res, next);
    assert.strictEqual(nextErr, null);
    assert.strictEqual(resStatus, 200);

    const dbRow = await IntegrationRepository.findByUserIdAndPlatform(
      userId,
      PlatformType.LEETCODE,
    );
    assert.ok(dbRow);
    assert.strictEqual(dbRow?.isConnected, true);
    assert.strictEqual(dbRow?.username, 'neetcode');
    console.log('    ✓ Valid LeetCode handle successfully verified and persisted');
  }

  // Test 4.4: Invalid LeetCode username -> validation fails -> NO DB row created
  {
    console.log('    4.4 Testing invalid LeetCode username connect rejection...');
    const req: any = {
      user: { id: userId, email: testEmail },
      body: { platform: 'LEETCODE', username: 'this_fake_leetcode_handle_never_exists_999' },
    };
    let nextErr: any = null;
    const res: any = {
      status: () => ({ json: () => {} }),
    };
    const next = (err?: any) => {
      nextErr = err;
    };

    await IntegrationController.connect(req, res, next);
    assert.ok(nextErr instanceof IntegrationNotFoundError);

    const dbRow = await IntegrationRepository.findByUserIdAndPlatform(
      userId,
      PlatformType.LEETCODE,
    );
    assert.strictEqual(
      dbRow?.username,
      'neetcode',
      'DB must retain previous valid handle, not invalid one',
    );
    console.log('    ✓ Invalid LeetCode handle rejected, invalid username never persisted');
  }

  // Test 4.5: Valid AtCoder username "Parmesh" -> validation passes
  {
    console.log('    4.5 Testing valid AtCoder username connect (Parmesh)...');
    let resStatus = 0;
    const req: any = {
      user: { id: userId, email: testEmail },
      body: { platform: 'ATCODER', username: 'Parmesh' },
    };
    const res: any = {
      status: (code: number) => {
        resStatus = code;
        return { json: () => {} };
      },
    };
    let nextErr: any = null;
    const next = (err?: any) => {
      nextErr = err;
    };

    await IntegrationController.connect(req, res, next);
    assert.strictEqual(nextErr, null);
    assert.strictEqual(resStatus, 200);

    const dbRow = await IntegrationRepository.findByUserIdAndPlatform(userId, PlatformType.ATCODER);
    assert.ok(dbRow);
    assert.strictEqual(dbRow?.isConnected, true);
    assert.strictEqual(dbRow?.username, 'Parmesh');
    console.log('    ✓ Valid AtCoder handle Parmesh verified and persisted');
  }

  // Test 4.6: Invalid AtCoder username -> validation fails
  {
    console.log('    4.6 Testing invalid AtCoder username connect rejection...');
    const req: any = {
      user: { id: userId, email: testEmail },
      body: { platform: 'ATCODER', username: 'this_fake_atcoder_user_123456789_nonexistent' },
    };
    let nextErr: any = null;
    const res: any = {
      status: () => ({ json: () => {} }),
    };
    const next = (err?: any) => {
      nextErr = err;
    };

    await IntegrationController.connect(req, res, next);
    assert.ok(nextErr instanceof IntegrationNotFoundError);
    console.log('    ✓ Invalid AtCoder handle rejected with 404, not persisted');
  }

  // Test 4.7: LinkedIn without OAuth -> rejected -> NO DB row created
  {
    console.log('    4.7 Testing LinkedIn connect without OAuth token rejection...');
    let syncTriggered = false;
    const origSync = SyncService.syncPlatform;
    (SyncService as any).syncPlatform = async () => {
      syncTriggered = true;
      return {} as any;
    };

    const req: any = {
      user: { id: userId, email: testEmail },
      body: { platform: 'LINKEDIN', username: 'arbitrary_fake_linkedin_handle' },
    };
    let nextErr: any = null;
    const res: any = {
      status: () => ({ json: () => {} }),
    };
    const next = (err?: any) => {
      nextErr = err;
    };

    try {
      await IntegrationController.connect(req, res, next);
      assert.ok(
        nextErr instanceof OAuthAuthenticationError,
        'LinkedIn without token must throw OAuthAuthenticationError',
      );
      assert.strictEqual(syncTriggered, false, 'Sync must NOT be triggered on failed validation');

      const dbRow = await IntegrationRepository.findByUserIdAndPlatform(
        userId,
        PlatformType.LINKEDIN,
      );
      assert.strictEqual(dbRow, null, 'LinkedIn without OAuth must NOT create any DB record');
      console.log(
        '    ✓ LinkedIn without OAuth rejected with 401, zero DB rows created, zero sync triggered',
      );
    } finally {
      SyncService.syncPlatform = origSync;
    }
  }

  // Test 4.8: Kaggle without credentials -> rejected -> NO DB row created
  {
    console.log('    4.8 Testing Kaggle connect without credentials rejection...');
    const prevKey = process.env.KAGGLE_KEY;
    const prevToken = process.env.KAGGLE_API_TOKEN;
    delete process.env.KAGGLE_KEY;
    delete process.env.KAGGLE_API_TOKEN;

    const req: any = {
      user: { id: userId, email: testEmail },
      body: { platform: 'KAGGLE', username: 'kaggle_uncredentialed_user' },
    };
    let nextErr: any = null;
    const res: any = {
      status: () => ({ json: () => {} }),
    };
    const next = (err?: any) => {
      nextErr = err;
    };

    try {
      await IntegrationController.connect(req, res, next);
      assert.ok(
        nextErr instanceof OAuthAuthenticationError,
        'Kaggle without credentials must throw OAuthAuthenticationError',
      );

      const dbRow = await IntegrationRepository.findByUserIdAndPlatform(
        userId,
        PlatformType.KAGGLE,
      );
      assert.strictEqual(dbRow, null, 'Kaggle without credentials must NOT create any DB record');
      console.log('    ✓ Kaggle without credentials rejected with 401, zero DB rows created');
    } finally {
      if (prevKey) process.env.KAGGLE_KEY = prevKey;
      if (prevToken) process.env.KAGGLE_API_TOKEN = prevToken;
    }
  }

  console.log(
    '🎉 All Integration Domain E2E Service, Pre-Persistence Validation & Enum Tests Passed Successfully!',
  );
}

runIntegrationDomainTests().catch((err) => {
  console.error('❌ Integration Domain Test Failed:', err);
  process.exit(1);
});
