/* eslint-disable @typescript-eslint/no-require-imports -- Stub the database module before loading integration modules. */
import assert from 'node:assert/strict';
import Module from 'node:module';

const fakePrisma = { platformIntegration: { upsert: async () => ({}) } };
const originalModuleLoad = (Module as any)._load;
(Module as any)._load = function (request: string, parent: any, isMain: boolean) {
  if (request === '@skilldna/database') return { prisma: fakePrisma };
  return originalModuleLoad.call(this, request, parent, isMain);
};

const { PlatformType } = require('@skilldna/shared');
const { GitHubController } = require('../controllers/github.controller');
const { IntegrationController } = require('../controllers/integration.controller');
const githubRoutes = require('../routes/github.routes').default;
const { INTEGRATION_CONSTANTS } = require('../constants/integration.constants');
const { SyncService } = require('../services/sync.service');
const { IntegrationRepository } = require('../repositories/integration.repository');
const { NormalizationService } = require('../services/normalization.service');
const { decryptPayload } = require('../../../utils/crypto.util');
const { generateOAuthState, resetOAuthStateStore } = require('../utils/oauth.state.util');
const { GitHubAdapter } = require('../adapters/github.adapter');

const originalFetch = global.fetch;
const originalClientId = process.env.GITHUB_CLIENT_ID;
const originalClientSecret = process.env.GITHUB_CLIENT_SECRET;
const originalRedirectUri = process.env.GITHUB_REDIRECT_URI;
const originalClientUrl = process.env.CLIENT_URL;
const originalEncryptionKey = process.env.ENCRYPTION_KEY;
const originalUpsert = fakePrisma.platformIntegration.upsert;
const originalSync = SyncService.syncPlatform;

function makeResponse() {
  let redirectStatus = 0;
  let redirectUrl = '';
  let jsonBody: any;
  return {
    status: () => ({ json: (body: any) => (jsonBody = body) }),
    redirect: (status: number, url: string) => {
      redirectStatus = status;
      redirectUrl = url;
    },
    getRedirect: () => ({ status: redirectStatus, url: redirectUrl }),
    getJson: () => jsonBody,
  };
}

async function callback(query: Record<string, string>) {
  const res = makeResponse();
  await GitHubController.oauthCallback({ query } as any, res as any, () => {});
  return res;
}

async function runGitHubOAuthTests() {
  process.env.GITHUB_CLIENT_ID = 'github-client-id-test';
  process.env.GITHUB_CLIENT_SECRET = 'github-client-secret-test';
  process.env.GITHUB_REDIRECT_URI = 'https://api.example.test/github/callback';
  process.env.CLIENT_URL = 'https://app.example.test';
  process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

  try {
    // The URL route is protected, and the controller creates a user-bound state.
    const oauthUrlRoute: any = (githubRoutes as any).stack.find(
      (layer: any) => layer.route?.path === '/oauth/url',
    );
    assert.ok(oauthUrlRoute);
    assert.equal(oauthUrlRoute.route.stack.length, 2);
    assert.ok(oauthUrlRoute.route.stack[0].name.includes('authenticate'));

    let unauthenticatedError: any;
    const { authenticate } = await import('../../../middleware/auth.middleware');
    authenticate({ headers: {} } as any, {} as any, (error?: any) => {
      unauthenticatedError = error;
    });
    assert.equal(unauthenticatedError?.statusCode, 401);

    const urlResponse = makeResponse();
    GitHubController.getOAuthUrl(
      { user: { id: 'oauth-user-1' }, query: { state: 'attacker' } } as any,
      urlResponse as any,
      () => {},
    );
    const authorizationUrl = new URL(urlResponse.getJson().data.url);
    assert.equal(authorizationUrl.searchParams.get('client_id'), 'github-client-id-test');
    assert.equal(
      authorizationUrl.searchParams.get('redirect_uri'),
      'https://api.example.test/github/callback',
    );
    assert.equal(authorizationUrl.searchParams.has('scope'), false);
    assert.notEqual(authorizationUrl.searchParams.get('state'), 'attacker');

    // Reject absent, tampered, expired and replayed state before token exchange.
    const missing = await callback({ code: 'auth-code' });
    assert.match(missing.getRedirect().url, /github=error&reason=missing_parameters/);

    const tamperedState = generateOAuthState('oauth-user-1').replace(/.$/, 'x');
    const tampered = await callback({ code: 'auth-code', state: tamperedState });
    assert.match(tampered.getRedirect().url, /reason=invalid_state/);

    resetOAuthStateStore();
    const expiredState = generateOAuthState('oauth-user-1', -1000);
    const expired = await callback({ code: 'auth-code', state: expiredState });
    assert.match(expired.getRedirect().url, /reason=invalid_state/);

    // Exercise real OAuthService token exchange with a mocked provider response.
    let tokenResponseOk = true;
    let identityResponseOk = true;
    let persistedCreate: any;
    const syncUserIds: string[] = [];
    (global as any).fetch = async (url: string) => {
      if (url === INTEGRATION_CONSTANTS.OAUTH_ENDPOINTS[PlatformType.GITHUB]!.tokenUrl) {
        return {
          ok: tokenResponseOk,
          status: tokenResponseOk ? 200 : 400,
          json: async () => ({ access_token: 'gho_mock_secret_token', token_type: 'bearer' }),
        };
      }
      if (url === `${INTEGRATION_CONSTANTS.API_ENDPOINTS.GITHUB}/user`) {
        return {
          ok: identityResponseOk,
          status: identityResponseOk ? 200 : 401,
          json: async () => ({
            login: 'verified-github-user',
            id: 123,
            avatar_url: 'https://example.test/avatar',
          }),
        };
      }
      throw new Error('Unexpected network request in mocked GitHub OAuth test');
    };

    (fakePrisma.platformIntegration as any).upsert = async ({ create }: any) => {
      persistedCreate = create;
      return { id: 'integration-id', ...create };
    };
    (SyncService as any).syncPlatform = async (userId: string, platform: string) => {
      assert.equal(platform, PlatformType.GITHUB);
      syncUserIds.push(userId);
      return { status: 'SUCCESS' };
    };

    let tokenExchangeFetchOptions: any;
    const fetchWithCapture = global.fetch;
    (global as any).fetch = async (url: string, options?: any) => {
      if (url === INTEGRATION_CONSTANTS.OAUTH_ENDPOINTS[PlatformType.GITHUB]!.tokenUrl) {
        tokenExchangeFetchOptions = options;
      }
      return fetchWithCapture(url, options);
    };

    resetOAuthStateStore();
    const replayState = generateOAuthState('oauth-user-1');
    const success = await callback({
      code: 'auth-code-secret',
      state: replayState,
      username: 'spoofed-handle',
    });
    assert.equal(success.getRedirect().status, 302);
    assert.equal(
      success.getRedirect().url,
      'https://app.example.test/integrations?github=connected',
    );
    assert.ok(persistedCreate);
    assert.equal(persistedCreate.username, 'verified-github-user');
    assert.equal(persistedCreate.userId, 'oauth-user-1');
    assert.equal(persistedCreate.platform, PlatformType.GITHUB);
    assert.notEqual(persistedCreate.accessToken, 'gho_mock_secret_token');
    const [iv, tag, encryptedData] = persistedCreate.accessToken.split(':');
    assert.equal(decryptPayload(encryptedData, iv, tag), 'gho_mock_secret_token');
    assert.ok(syncUserIds.includes('oauth-user-1'));
    assert.ok(!success.getRedirect().url.includes('auth-code-secret'));
    assert.ok(!success.getRedirect().url.includes('gho_mock_secret_token'));
    assert.equal(success.getJson(), undefined);
    assert.equal(tokenExchangeFetchOptions.method, 'POST');

    const replay = await callback({ code: 'auth-code-secret', state: replayState });
    assert.match(replay.getRedirect().url, /reason=invalid_state/);

    // Normal GitHub sync uses the decrypted, server-stored token and persisted identity.
    const originalFindIntegration = IntegrationRepository.findByUserIdAndPlatform;
    const originalUpdateSyncStatus = IntegrationRepository.updateSyncStatus;
    const originalNormalizeAndPersist = NormalizationService.normalizeAndPersist;
    (SyncService as any).syncPlatform = originalSync;
    (IntegrationRepository as any).findByUserIdAndPlatform = async () => ({
      id: 'integration-id',
      username: 'verified-github-user',
      accessToken: 'gho_mock_secret_token',
      isConnected: true,
    });
    (IntegrationRepository as any).updateSyncStatus = async () => ({});
    (NormalizationService as any).normalizeAndPersist = async () => undefined;
    const syncAuthorizationHeaders: string[] = [];
    (global as any).fetch = async (url: string, options: any) => {
      syncAuthorizationHeaders.push(options.headers.Authorization);
      if (url.endsWith('/users/verified-github-user')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 123, public_repos: 0, public_gists: 0 }),
          headers: new Headers(),
        };
      }
      if (url.includes('/users/verified-github-user/repos?')) {
        return { ok: true, status: 200, json: async () => [], headers: new Headers() };
      }
      throw new Error('Unexpected request during mocked GitHub sync');
    };
    const syncResponse = makeResponse();
    await GitHubController.sync(
      {
        user: { id: 'oauth-user-1' },
        body: { accessToken: 'frontend-token-must-be-ignored', username: 'spoofed-handle' },
        params: { username: 'spoofed-handle' },
      } as any,
      syncResponse as any,
      () => {},
    );
    assert.ok(syncAuthorizationHeaders.length > 0);
    assert.ok(
      syncAuthorizationHeaders.every((header) => header === 'Bearer gho_mock_secret_token'),
    );
    (IntegrationRepository as any).findByUserIdAndPlatform = originalFindIntegration;
    (IntegrationRepository as any).updateSyncStatus = originalUpdateSyncStatus;
    (NormalizationService as any).normalizeAndPersist = originalNormalizeAndPersist;

    // Provider denial, failed exchange, failed identity, and persistence errors are safe redirects.
    global.fetch = fetchWithCapture;
    const denied = await callback({ error: 'access_denied', state: 'irrelevant' });
    assert.match(denied.getRedirect().url, /reason=cancelled/);

    tokenResponseOk = false;
    const exchangeFailure = await callback({
      code: 'bad-code',
      state: generateOAuthState('oauth-user-1'),
    });
    assert.match(exchangeFailure.getRedirect().url, /reason=token_exchange_failed/);
    tokenResponseOk = true;

    identityResponseOk = false;
    const identityFailure = await callback({
      code: 'auth-code',
      state: generateOAuthState('oauth-user-1'),
    });
    assert.match(identityFailure.getRedirect().url, /reason=identity_verification_failed/);
    identityResponseOk = true;

    (fakePrisma.platformIntegration as any).upsert = async () => {
      throw new Error('database failure');
    };
    const persistenceFailure = await callback({
      code: 'auth-code',
      state: generateOAuthState('oauth-user-1'),
    });
    assert.match(persistenceFailure.getRedirect().url, /reason=persistence_failed/);

    // Username-only validation remains supported and does not use caller-supplied tokens.
    let validationHeaders: any;
    (global as any).fetch = async (_url: string, options: any) => {
      validationHeaders = options.headers;
      return { ok: true, status: 200, headers: new Headers() };
    };
    assert.equal(await new GitHubAdapter().validateCredentials('public-handle'), true);
    assert.equal(validationHeaders.Authorization, undefined);

    let connectStatus = 0;
    let connectBody: any;
    let nextError: any;
    (SyncService as any).syncPlatform = async (userId: string, platform: string) => {
      assert.equal(platform, PlatformType.GITHUB);
      syncUserIds.push(userId);
      return { status: 'SUCCESS' };
    };
    (fakePrisma.platformIntegration as any).upsert = async ({ create }: any) => {
      persistedCreate = create;
      return { id: 'username-only-integration', ...create, isConnected: true, syncStatus: 'IDLE' };
    };
    (global as any).fetch = async (_url: string, options: any) => {
      validationHeaders = options.headers;
      return { ok: true, status: 200, headers: new Headers() };
    };
    await IntegrationController.connect(
      {
        user: { id: 'username-only-user' },
        body: {
          platform: 'GITHUB',
          username: 'public-handle',
          accessToken: 'must-not-be-stored',
          refreshToken: 'must-not-be-stored-either',
        },
      } as any,
      {
        status: (status: number) => {
          connectStatus = status;
          return { json: (body: any) => (connectBody = body) };
        },
      } as any,
      (error?: any) => (nextError = error),
    );
    assert.equal(nextError, undefined);
    assert.equal(connectStatus, 200);
    assert.equal(connectBody.success, true);
    assert.equal(persistedCreate.username, 'public-handle');
    assert.equal(persistedCreate.accessToken, undefined);
    assert.equal(persistedCreate.refreshToken, undefined);
    assert.equal(validationHeaders.Authorization, undefined);
    assert.ok(syncUserIds.includes('username-only-user'));

    console.log('GitHub OAuth mocked tests passed.');
  } finally {
    global.fetch = originalFetch;
    (fakePrisma.platformIntegration as any).upsert = originalUpsert;
    (Module as any)._load = originalModuleLoad;
    (SyncService as any).syncPlatform = originalSync;
    process.env.GITHUB_CLIENT_ID = originalClientId;
    process.env.GITHUB_CLIENT_SECRET = originalClientSecret;
    process.env.GITHUB_REDIRECT_URI = originalRedirectUri;
    process.env.CLIENT_URL = originalClientUrl;
    process.env.ENCRYPTION_KEY = originalEncryptionKey;
    resetOAuthStateStore();
  }
}

runGitHubOAuthTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
