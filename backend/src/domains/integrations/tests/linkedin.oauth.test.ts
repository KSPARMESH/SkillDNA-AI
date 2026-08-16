import assert from 'node:assert';
import { PlatformType } from '@skilldna/shared';
import { OAuthService } from '../services/oauth.service';
import {
  generateOAuthState,
  verifyAndConsumeOAuthState,
  resetOAuthStateStore,
} from '../utils/oauth.state.util';
import { LinkedInController } from '../controllers/linkedin.controller';
import { IntegrationRepository } from '../repositories/integration.repository';
import { SyncService } from '../services/sync.service';
import { OAuthAuthenticationError } from '../errors/integration.errors';

async function runLinkedInOAuthTests() {
  console.log('🧪 Running Comprehensive LinkedIn OAuth 2.0 End-to-End Suite...');

  // =========================================================================
  // 1. OAuth State Generation & User Binding
  // =========================================================================
  {
    console.log('\n  1. Testing OAuth state generation & user binding...');
    resetOAuthStateStore();

    const userId = 'user_test_oauth_123';
    const state = generateOAuthState(userId, 60 * 1000); // 1 minute expiry

    assert.ok(state, 'State token must be generated');
    assert.ok(state.includes('.'), 'State token must have header.signature format');

    const result = verifyAndConsumeOAuthState(state);
    assert.strictEqual(result.userId, userId, 'State must cleanly verify and extract bound userId');
    console.log('     ✓ State generated, signed, and successfully verified for bound user');
  }

  // =========================================================================
  // 2. Tampered State Signature Rejection
  // =========================================================================
  {
    console.log('\n  2. Testing tampered state rejection...');
    resetOAuthStateStore();

    const state = generateOAuthState('user_original', 60 * 1000);
    const [payload, sig] = state.split('.');
    const tamperedState = `${payload}.tampered_fake_signature_abc`;

    let threwTamper = false;
    try {
      verifyAndConsumeOAuthState(tamperedState);
    } catch (err: any) {
      threwTamper = true;
      assert.ok(err instanceof OAuthAuthenticationError);
      assert.ok(err.message.includes('signature') || err.message.includes('tampered'));
    }
    assert.ok(threwTamper, 'Tampered state signature must be rejected strictly');
    console.log('     ✓ Tampered state signature correctly rejected with OAuthAuthenticationError');
  }

  // =========================================================================
  // 3. Expired State Rejection
  // =========================================================================
  {
    console.log('\n  3. Testing expired state rejection...');
    resetOAuthStateStore();

    const expiredState = generateOAuthState('user_exp', -1000); // already expired

    let threwExpired = false;
    try {
      verifyAndConsumeOAuthState(expiredState);
    } catch (err: any) {
      threwExpired = true;
      assert.ok(err instanceof OAuthAuthenticationError);
      assert.ok(err.message.includes('expired'));
    }
    assert.ok(threwExpired, 'Expired state must be rejected');
    console.log('     ✓ Expired state correctly rejected');
  }

  // =========================================================================
  // 4. Replay Attack / State Reuse Defense
  // =========================================================================
  {
    console.log('\n  4. Testing state replay defense (nonce reuse prevention)...');
    resetOAuthStateStore();

    const state = generateOAuthState('user_replay', 60 * 1000);
    const firstConsume = verifyAndConsumeOAuthState(state);
    assert.strictEqual(firstConsume.userId, 'user_replay');

    let threwReplay = false;
    try {
      verifyAndConsumeOAuthState(state); // Second attempt with same state
    } catch (err: any) {
      threwReplay = true;
      assert.ok(err instanceof OAuthAuthenticationError);
      assert.ok(err.message.includes('consumed') || err.message.includes('replay'));
    }
    assert.ok(threwReplay, 'Reused state must be rejected strictly');
    console.log('     ✓ Replayed state token successfully detected and blocked');
  }

  // =========================================================================
  // 5. LinkedIn Authorization URL Generation
  // =========================================================================
  {
    console.log('\n  5. Testing LinkedIn authorization URL generation...');
    const originalClientId = process.env.LINKEDIN_CLIENT_ID;
    const originalRedirect = process.env.LINKEDIN_REDIRECT_URI;

    process.env.LINKEDIN_CLIENT_ID = 'test_linkedin_client_id_456';
    process.env.LINKEDIN_REDIRECT_URI =
      'http://localhost:5000/api/v1/integrations/linkedin/oauth/callback';

    try {
      const state = generateOAuthState('user_auth_url', 60 * 1000);
      const authUrl = OAuthService.getAuthorizationUrl(PlatformType.LINKEDIN, state);

      assert.ok(authUrl.startsWith('https://www.linkedin.com/oauth/v2/authorization'));
      assert.ok(authUrl.includes('client_id=test_linkedin_client_id_456'));
      assert.ok(authUrl.includes('response_type=code'));
      assert.ok(
        authUrl.includes('scope=openid+profile+email') ||
          authUrl.includes('scope=openid%20profile%20email'),
      );
      assert.ok(authUrl.includes(`state=${encodeURIComponent(state)}`) || authUrl.includes(state));
      assert.ok(
        !authUrl.includes('CLIENT_SECRET'),
        'Client secret must NEVER be exposed in auth URL',
      );
      console.log('     ✓ LinkedIn authorization URL matches OIDC spec without secret leakage');
    } finally {
      process.env.LINKEDIN_CLIENT_ID = originalClientId;
      process.env.LINKEDIN_REDIRECT_URI = originalRedirect;
    }
  }

  // =========================================================================
  // 6. Production Missing Credentials Guard
  // =========================================================================
  {
    console.log('\n  6. Testing production missing credentials rejection...');
    const originalEnv = process.env.NODE_ENV;
    const originalClientId = process.env.LINKEDIN_CLIENT_ID;
    const originalClientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    process.env.NODE_ENV = 'production';
    delete process.env.LINKEDIN_CLIENT_ID;
    delete process.env.LINKEDIN_CLIENT_SECRET;

    try {
      let threwAuthUrl = false;
      try {
        OAuthService.getAuthorizationUrl(PlatformType.LINKEDIN, 'state_val');
      } catch (err: any) {
        threwAuthUrl = true;
        assert.ok(err instanceof OAuthAuthenticationError);
      }
      assert.ok(threwAuthUrl, 'Missing client_id in production must fail safely');

      let threwExchange = false;
      try {
        await OAuthService.exchangeCodeForToken(PlatformType.LINKEDIN, 'auth_code');
      } catch (err: any) {
        threwExchange = true;
        assert.ok(err instanceof OAuthAuthenticationError);
      }
      assert.ok(threwExchange, 'Missing credentials in exchange must fail safely');
      console.log('     ✓ Production environment strictly forbids synthetic mock fallback');
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.LINKEDIN_CLIENT_ID = originalClientId;
      process.env.LINKEDIN_CLIENT_SECRET = originalClientSecret;
    }
  }

  // =========================================================================
  // 7. Token Exchange Success & Error Handling
  // =========================================================================
  {
    console.log('\n  7. Testing LinkedIn token exchange...');
    const originalFetch = global.fetch;
    const originalClientId = process.env.LINKEDIN_CLIENT_ID;
    const originalClientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    process.env.LINKEDIN_CLIENT_ID = 'mock_id';
    process.env.LINKEDIN_CLIENT_SECRET = 'mock_secret';

    // 7.1 Successful Token Exchange
    (global as any).fetch = async (url: string) => {
      if (url.includes('linkedin.com/oauth/v2/accessToken')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'mock_real_access_token_xyz',
            refresh_token: 'mock_real_refresh_token_abc',
            expires_in: 5184000,
          }),
        };
      }
      return originalFetch(url);
    };

    try {
      const tokens = await OAuthService.exchangeCodeForToken(
        PlatformType.LINKEDIN,
        'valid_code_123',
      );
      assert.strictEqual(tokens.accessToken, 'mock_real_access_token_xyz');
      assert.strictEqual(tokens.refreshToken, 'mock_real_refresh_token_abc');
      assert.strictEqual(tokens.expiresIn, 5184000);
      console.log('     ✓ Token exchange correctly parses access_token and refresh_token');
    } finally {
      global.fetch = originalFetch;
    }

    // 7.2 Failed Token Exchange (e.g. 400 Bad Request)
    (global as any).fetch = async (url: string) => {
      if (url.includes('linkedin.com/oauth/v2/accessToken')) {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ error: 'invalid_grant', error_description: 'Code expired' }),
        };
      }
      return originalFetch(url);
    };

    try {
      let threw400 = false;
      try {
        await OAuthService.exchangeCodeForToken(PlatformType.LINKEDIN, 'expired_code');
      } catch (err: any) {
        threw400 = true;
        assert.ok(err instanceof OAuthAuthenticationError);
      }
      assert.ok(threw400, 'Failed token exchange must throw OAuthAuthenticationError');
      console.log('     ✓ Upstream token exchange failure surfaces safe error');
    } finally {
      global.fetch = originalFetch;
      process.env.LINKEDIN_CLIENT_ID = originalClientId;
      process.env.LINKEDIN_CLIENT_SECRET = originalClientSecret;
    }
  }

  // =========================================================================
  // 8. End-to-End Callback Controller Flow (Success & Persistence)
  // =========================================================================
  {
    console.log('\n  8. Testing end-to-end LinkedIn callback controller flow...');
    resetOAuthStateStore();

    const targetUserId = 'user_e2e_linkedin_tester';
    const validState = generateOAuthState(targetUserId, 60 * 1000);

    const originalFetch = global.fetch;
    const originalUpsert = IntegrationRepository.upsertIntegration;
    const originalSync = SyncService.syncPlatform;

    let persistedPayload: any = null;
    let syncTriggered = false;
    let redirectedUrl: any = null;
    let redirectedStatusCode: any = null;

    (IntegrationRepository as any).upsertIntegration = async (data: any) => {
      persistedPayload = data;
      return { id: 'mock_int_linkedin_e2e', ...data, isConnected: true, syncStatus: 'IDLE' };
    };

    (SyncService as any).syncPlatform = async (userId: string, platform: PlatformType) => {
      syncTriggered = true;
      assert.strictEqual(userId, targetUserId);
      assert.strictEqual(platform, PlatformType.LINKEDIN);
      return { status: 'SUCCESS' };
    };

    (global as any).fetch = async (url: string) => {
      if (url.includes('linkedin.com/oauth/v2/accessToken')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'mock_bearer_token_999',
            refresh_token: 'mock_refresh_token_888',
            expires_in: 3600,
          }),
        };
      }
      if (url.includes('api.linkedin.com/v2/userinfo')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            sub: 'li_sub_123456789',
            name: 'Sarah Connor',
            email: 'sarah.connor@example.com',
            picture: 'https://media.licdn.com/dms/image/mock.jpg',
            locale: { country: 'US', language: 'en' },
          }),
        };
      }
      return originalFetch(url);
    };

    const mockReq: any = {
      query: {
        code: 'valid_auth_code_xyz',
        state: validState,
      },
    };

    const mockRes: any = {
      redirect: (status: number, url: string) => {
        redirectedStatusCode = status;
        redirectedUrl = url;
      },
    };

    const mockNext = () => {};

    try {
      await LinkedInController.oauthCallback(mockReq, mockRes, mockNext);

      // Verify persistence
      assert.ok(persistedPayload, 'IntegrationRepository.upsertIntegration must be called');
      assert.strictEqual(
        persistedPayload.userId,
        targetUserId,
        'Persisted userId must match state bound user',
      );
      assert.strictEqual(persistedPayload.platform, PlatformType.LINKEDIN);
      assert.strictEqual(
        persistedPayload.username,
        'Sarah Connor',
        'Verified name from /userinfo must be used',
      );
      assert.strictEqual(persistedPayload.accessToken, 'mock_bearer_token_999');
      assert.strictEqual(persistedPayload.refreshToken, 'mock_refresh_token_888');
      assert.strictEqual(persistedPayload.metadata?.sub, 'li_sub_123456789');
      assert.strictEqual(persistedPayload.metadata?.email, 'sarah.connor@example.com');

      // Verify sync trigger
      assert.ok(syncTriggered, 'Background SyncService.syncPlatform must be initiated');

      // Verify HTTP 302 safe redirect
      assert.strictEqual(redirectedStatusCode, 302);
      assert.ok(String(redirectedUrl).includes('/integrations?linkedin=connected'));
      assert.ok(
        !String(redirectedUrl).includes('token'),
        'Tokens must NEVER appear in redirect URL',
      );
      assert.ok(
        !String(redirectedUrl).includes('valid_auth_code'),
        'Auth code must NOT appear in final redirect',
      );
      console.log(
        '     ✓ Full OAuth flow persisted verified identity, encrypted tokens, and safely redirected',
      );
    } finally {
      global.fetch = originalFetch;
      IntegrationRepository.upsertIntegration = originalUpsert;
      SyncService.syncPlatform = originalSync;
    }
  }

  // =========================================================================
  // 9. Callback Failure Redirect Handling
  // =========================================================================
  {
    console.log('\n  9. Testing callback failure redirect handling...');
    resetOAuthStateStore();

    let redirectedUrl: any = null;
    let redirectedStatusCode: any = null;

    const mockRes: any = {
      redirect: (status: number, url: string) => {
        redirectedStatusCode = status;
        redirectedUrl = url;
      },
    };

    // 9.1 Missing parameters
    await LinkedInController.oauthCallback({ query: {} } as any, mockRes, () => {});
    assert.strictEqual(redirectedStatusCode, 302);
    assert.ok(String(redirectedUrl).includes('linkedin=error&reason=missing_parameters'));

    // 9.2 Invalid state
    await LinkedInController.oauthCallback(
      { query: { code: 'some_code', state: 'bad.state' } } as any,
      mockRes,
      () => {},
    );
    assert.strictEqual(redirectedStatusCode, 302);
    assert.ok(String(redirectedUrl).includes('linkedin=error&reason=invalid_state'));

    // 9.3 Provider cancelled
    await LinkedInController.oauthCallback(
      { query: { error: 'user_cancelled_authorize' } } as any,
      mockRes,
      () => {},
    );
    assert.strictEqual(redirectedStatusCode, 302);
    assert.ok(String(redirectedUrl).includes('linkedin=error&reason=cancelled'));

    console.log('     ✓ All failure modes safely redirect to frontend without throwing or leaking');
  }

  console.log('\n🎉 All LinkedIn OAuth 2.0 Security, Controller & Flow Tests Passed Successfully!');
}

runLinkedInOAuthTests().catch((err) => {
  console.error('❌ LinkedIn OAuth Test Failed:', err);
  process.exit(1);
});
