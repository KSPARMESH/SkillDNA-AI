import assert from 'node:assert';
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

  console.log('🎉 All Integration Domain E2E Service & Enum Mapping Tests Passed Successfully!');
}

runIntegrationDomainTests().catch((err) => {
  console.error('❌ Integration Domain Test Failed:', err);
  process.exit(1);
});
