import assert from 'node:assert';
import { AuthService } from '../../../domains/auth/auth.service';
import { IntegrationRepository } from '../repositories/integration.repository';
import { PlatformType } from '@skilldna/shared';
import { OAuthService } from '../services/oauth.service';

async function runIntegrationDomainTests() {
  console.log('🧪 Running Integration Domain E2E Service Tests...');

  // 1. Create a test user for DB integrations
  const testEmail = `integration.test.${Date.now()}@skilldna.ai`;
  const registerResult = await AuthService.register({
    email: testEmail,
    password: 'Password123!',
    firstName: 'Integration',
    lastName: 'Tester',
  });
  const userId = registerResult.user.id;

  // Test Case 1: Connect Platform Integration
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
    await IntegrationRepository.disconnectIntegration(userId, PlatformType.GITHUB);
    const disconnected = await IntegrationRepository.findByUserIdAndPlatform(
      userId,
      PlatformType.GITHUB,
    );
    assert.strictEqual(disconnected?.isConnected, false, 'Integration should be disconnected');
    assert.ok(!disconnected?.accessToken, 'Access token should be removed/falsy');
    console.log('  ✅ Passed: IntegrationRepository.disconnectIntegration');
  }

  console.log('🎉 All Integration Domain E2E Service Tests Passed Successfully!');
}

runIntegrationDomainTests().catch((err) => {
  console.error('❌ Integration Domain Test Failed:', err);
  process.exit(1);
});
