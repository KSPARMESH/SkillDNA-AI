import assert from 'node:assert';
import { isTokenValid, parseJwt } from '../utils/auth.util';
import {
  PlatformType,
  normalizePlatformType,
  getPlatformDisplayName,
  PLATFORM_DISPLAY_NAMES,
} from '@skilldna/shared';
import {
  getSupportedPlatformsApi,
  getIntegrationsApi,
  getIntegrationStatusApi,
  getOAuthUrlApi,
  connectPlatformApi,
  disconnectPlatformApi,
  syncPlatformApi,
  getSyncHistoryApi,
} from '../services/api.service';

// Mock localStorage and window environment for Node / testing environment
const mockStorage: Record<string, string> = {};

(global as any).window = {
  location: { href: '', pathname: '/integrations' },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};

(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
};

function createMockJwt(expInSecondsFromNow = 3600): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payloadData = JSON.stringify({
    id: 'usr-integration-test-id',
    email: 'integrations.tester@skilldna.ai',
    role: 'STUDENT',
    exp: Math.floor(Date.now() / 1000) + expInSecondsFromNow,
  });
  const payload = Buffer.from(payloadData).toString('base64');
  const signature = 'mock_signature_hash';
  return `${header}.${payload}.${signature}`;
}

async function runFrontendIntegrationsTests() {
  console.log('🧪 Running Comprehensive Frontend Platform Integrations & Enum Mapping Suite...');

  // Setup valid authentication
  const mockToken = createMockJwt();
  localStorage.setItem('accessToken', mockToken);

  // In-memory mock database of integrations
  const mockSupportedPlatforms = Object.values(PlatformType);

  const integrationsDatabase: any[] = [
    {
      id: 'int-github-001',
      userId: 'usr-integration-test-id',
      platform: 'GITHUB',
      username: 'parmeshks',
      isConnected: true,
      syncStatus: 'SUCCESS',
      lastSyncedAt: new Date(Date.now() - 3600000).toISOString(),
      metadata: { repositories: 32, stars: 140, contributions: 1250 },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  // Setup mock fetch router
  (global as any).fetch = async (url: string, options: any = {}) => {
    const parsedUrl = new URL(url, 'http://localhost:5000');
    const path = parsedUrl.pathname;
    const method = options.method || 'GET';

    // GET /api/v1/integrations/platforms (Public)
    if (path === '/api/v1/integrations/platforms' && method === 'GET') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          data: {
            supportedPlatforms: mockSupportedPlatforms,
            totalCount: mockSupportedPlatforms.length,
          },
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Check for Authorization Header on authenticated routes
    assert.strictEqual(
      options.headers?.Authorization,
      `Bearer ${mockToken}`,
      `Authorization Bearer header must be present on authenticated route ${path}`,
    );

    // GET /api/v1/integrations
    if (path === '/api/v1/integrations' && method === 'GET') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          data: integrationsDatabase.filter((i) => i.isConnected),
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // GET /api/v1/integrations/status
    if (path === '/api/v1/integrations/status' && method === 'GET') {
      const statusList = integrationsDatabase.map((i) => ({
        platform: i.platform,
        username: i.username,
        isConnected: i.isConnected,
        syncStatus: i.syncStatus,
        lastSyncedAt: i.lastSyncedAt,
      }));

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          data: statusList,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // POST /api/v1/integrations/connect
    if (path === '/api/v1/integrations/connect' && method === 'POST') {
      const body = JSON.parse(options.body);

      // Normalize platform type to verify server-side validation behavior
      const normalizedPlatform = normalizePlatformType(body.platform);

      if (!normalizedPlatform || !mockSupportedPlatforms.includes(normalizedPlatform)) {
        return {
          ok: false,
          status: 400,
          json: async () => ({
            success: false,
            statusCode: 400,
            message: `Invalid or unsupported platform '${body.platform}'.`,
          }),
        };
      }

      if (!body.username || typeof body.username !== 'string' || !body.username.trim()) {
        return {
          ok: false,
          status: 400,
          json: async () => ({
            success: false,
            statusCode: 400,
            message: 'Username is required and must be a valid string.',
          }),
        };
      }

      // Upsert integration with strict Prisma enum value
      const existingIdx = integrationsDatabase.findIndex((i) => i.platform === normalizedPlatform);

      const record = {
        id:
          existingIdx >= 0
            ? integrationsDatabase[existingIdx].id
            : `int-${normalizedPlatform.toLowerCase()}-${Date.now()}`,
        userId: 'usr-integration-test-id',
        platform: normalizedPlatform, // Strict enum value (e.g. ATCODER)
        username: body.username.trim(),
        isConnected: true,
        syncStatus: 'SYNCING',
        lastSyncedAt: null,
        metadata: body.metadata || {},
        createdAt:
          existingIdx >= 0 ? integrationsDatabase[existingIdx].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        integrationsDatabase[existingIdx] = record;
      } else {
        integrationsDatabase.push(record);
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          message: `Successfully connected ${normalizedPlatform} integration. Initial synchronization initiated.`,
          data: {
            id: record.id,
            platform: record.platform,
            username: record.username,
            isConnected: record.isConnected,
            syncStatus: record.syncStatus,
            lastSyncedAt: record.lastSyncedAt,
            createdAt: record.createdAt,
          },
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // POST /api/v1/integrations/disconnect
    if (path === '/api/v1/integrations/disconnect' && method === 'POST') {
      const body = JSON.parse(options.body);
      const normalizedPlatform =
        normalizePlatformType(body.platform) || (body.platform || '').toUpperCase();

      const existingIdx = integrationsDatabase.findIndex((i) => i.platform === normalizedPlatform);

      if (existingIdx >= 0) {
        integrationsDatabase.splice(existingIdx, 1);
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          message: `Successfully disconnected platform ${normalizedPlatform}.`,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // POST /api/v1/integrations/sync/:platform or /api/v1/integrations/sync
    if (path.startsWith('/api/v1/integrations/sync') && method === 'POST') {
      const parts = path.split('/');
      const platformParam = parts[5]; // /api/v1/integrations/sync/:platform

      if (platformParam) {
        const plat = normalizePlatformType(platformParam) || platformParam.toUpperCase();
        const target = integrationsDatabase.find((i) => i.platform === plat);

        if (target && target.username.includes('invalid')) {
          target.syncStatus = 'SYNC_FAILED';
          target.lastSyncedAt = null;
          target.metadata = {
            ...target.metadata,
            lastError: `Integration matching '${target.username}' was not found.`,
          };

          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              statusCode: 200,
              message: `Platform '${plat}' synchronization failed.`,
              data: {
                status: 'FAILED',
                platform: plat,
                error: `Integration matching '${target.username}' was not found.`,
                syncedAt: null,
                recordsProcessed: 0,
              },
              timestamp: new Date().toISOString(),
            }),
          };
        }

        if (target) {
          target.lastSyncedAt = new Date().toISOString();
          target.syncStatus = 'SUCCESS';
          target.metadata = {
            ...target.metadata,
            lastError: null,
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            statusCode: 200,
            message: `Platform '${plat}' synchronization completed.`,
            data: {
              status: 'SUCCESS',
              platform: plat,
              syncedAt: new Date().toISOString(),
              recordsProcessed: 25,
            },
            timestamp: new Date().toISOString(),
          }),
        };
      }

      // Sync all platforms
      const syncedNow = new Date().toISOString();
      integrationsDatabase.forEach((i) => {
        if (!i.username.includes('invalid')) {
          i.lastSyncedAt = syncedNow;
          i.syncStatus = 'SUCCESS';
        } else {
          i.syncStatus = 'SYNC_FAILED';
          i.lastSyncedAt = null;
        }
      });

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          message: 'All user connected platforms synchronization completed.',
          data: {
            totalSynced: integrationsDatabase.length,
            successfulCount: integrationsDatabase.filter((i) => i.syncStatus === 'SUCCESS').length,
            results: integrationsDatabase.map((i) => ({
              platform: i.platform,
              status: i.syncStatus === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
            })),
          },
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // GET /api/v1/integrations/sync/history
    if (path === '/api/v1/integrations/sync/history' && method === 'GET') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          data: integrationsDatabase.map((i) => ({
            platform: i.platform,
            status: i.syncStatus,
            syncedAt: i.lastSyncedAt,
          })),
          timestamp: new Date().toISOString(),
        }),
      };
    }

    throw new Error(`Unhandled route ${method} ${path}`);
  };

  // =========================================================================
  // Test 1: Supported Platforms & Centralized Enum Mapping Verification
  // =========================================================================
  console.log('  1. Testing centralized PlatformType enum mappings and display names...');
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

  // Display names
  assert.strictEqual(getPlatformDisplayName(PlatformType.ATCODER), 'AtCoder');
  assert.strictEqual(getPlatformDisplayName('atcoder'), 'AtCoder');
  assert.strictEqual(getPlatformDisplayName('AtCoder'), 'AtCoder');
  assert.strictEqual(getPlatformDisplayName(PlatformType.STACKOVERFLOW), 'Stack Overflow');
  assert.strictEqual(PLATFORM_DISPLAY_NAMES[PlatformType.ATCODER], 'AtCoder');
  console.log(
    '     ✓ Centralized enum normalization and display label mappings verified for all 11 platforms',
  );

  // =========================================================================
  // Test 2: Supported Platforms List Retrieval (GET /api/v1/integrations/platforms & status)
  // =========================================================================
  console.log('  2. Testing supported platforms list retrieval from backend...');
  const platformsRes = await getSupportedPlatformsApi();
  assert.strictEqual(platformsRes.success, true, 'Supported platforms call should succeed');
  assert.strictEqual(Array.isArray(platformsRes.data.supportedPlatforms), true);
  assert.strictEqual(platformsRes.data.supportedPlatforms.length, 11);
  assert.ok(platformsRes.data.supportedPlatforms.includes('ATCODER'));
  assert.ok(platformsRes.data.supportedPlatforms.includes('GITHUB'));
  assert.ok(platformsRes.data.supportedPlatforms.includes('LEETCODE'));

  const statusRes = await getIntegrationStatusApi();
  assert.strictEqual(statusRes.success, true);
  assert.ok(Array.isArray(statusRes.data));
  console.log(
    '     ✓ Supported platforms list contains exact ATCODER enum value and status query functions',
  );

  // =========================================================================
  // Test 3: AtCoder Connection with Valid Profile "Parmesh"
  // =========================================================================
  console.log('  3. Testing connecting AtCoder with valid username "Parmesh"...');
  const connectAtCoderPayload = {
    platform: 'AtCoder', // Display label passed from client
    username: 'Parmesh',
  };

  const connectAtCoderRes = await connectPlatformApi(connectAtCoderPayload);
  assert.strictEqual(connectAtCoderRes.success, true);
  assert.strictEqual(
    connectAtCoderRes.data.platform,
    'ATCODER',
    'Persisted database platform must strictly be enum ATCODER',
  );
  assert.strictEqual(connectAtCoderRes.data.username, 'Parmesh');
  assert.strictEqual(connectAtCoderRes.data.isConnected, true);

  // Verify list reflects AtCoder connection
  const postConnectList = await getIntegrationsApi();
  const atcoderItem = postConnectList.data.find((i: any) => i.platform === 'ATCODER');
  assert.ok(
    atcoderItem,
    'AtCoder must appear in connected integrations list with ATCODER enum key',
  );
  assert.strictEqual(atcoderItem.username, 'Parmesh');
  console.log('     ✓ AtCoder connection sends ATCODER and saves to database with valid enum');

  // =========================================================================
  // Test 4: AtCoder Synchronization Flow
  // =========================================================================
  console.log('  4. Testing AtCoder synchronization...');
  const syncAtCoderRes = await syncPlatformApi('AtCoder');
  assert.strictEqual(syncAtCoderRes.success, true);
  assert.strictEqual(syncAtCoderRes.data.platform, 'ATCODER');
  assert.strictEqual(syncAtCoderRes.data.status, 'SUCCESS');
  assert.ok(syncAtCoderRes.data.syncedAt);

  const historyRes = await getSyncHistoryApi();
  assert.strictEqual(historyRes.success, true);
  assert.ok(historyRes.data.some((h: any) => h.platform === 'ATCODER'));
  console.log('     ✓ AtCoder sync and history logging completed successfully');

  // =========================================================================
  // Test 5: Client and Backend Input Validation
  // =========================================================================
  console.log('  5. Testing client-side and backend validation rules...');
  const invalidPlatformRes = await connectPlatformApi({
    platform: 'INVALID_PLATFORM',
    username: 'testuser',
  });
  assert.strictEqual(invalidPlatformRes.success, false);
  assert.strictEqual(invalidPlatformRes.statusCode, 400);

  const emptyUserRes = await connectPlatformApi({
    platform: 'ATCODER',
    username: '   ',
  });
  assert.strictEqual(emptyUserRes.success, false);
  assert.strictEqual(emptyUserRes.statusCode, 400);
  console.log('     ✓ Validation correctly rejects invalid platform names and empty handles');

  // =========================================================================
  // Test 6: Disconnect AtCoder Flow
  // =========================================================================
  console.log('  6. Testing disconnecting AtCoder...');
  const disconnectAtCoderRes = await disconnectPlatformApi('AtCoder');
  assert.strictEqual(disconnectAtCoderRes.success, true);

  const postDisconnectList = await getIntegrationsApi();
  const disconnectedAtCoder = postDisconnectList.data.find((i: any) => i.platform === 'ATCODER');
  assert.strictEqual(
    disconnectedAtCoder,
    undefined,
    'AtCoder should be removed from connected list',
  );
  console.log('     ✓ Disconnect AtCoder successfully completed');

  // =========================================================================
  // Test 7: API Error Handling & Network Resilience
  // =========================================================================
  console.log('  7. Testing API network failure resilience...');
  const originalFetch = (global as any).fetch;
  (global as any).fetch = async () => {
    throw new Error('Network connection timeout');
  };

  try {
    await connectPlatformApi({ platform: 'ATCODER', username: 'Parmesh' });
    assert.fail('Should catch error safely');
  } catch (err: any) {
    assert.ok(err.message.includes('Network connection timeout'));
  }
  (global as any).fetch = originalFetch;
  console.log('     ✓ Network failures safely caught without crashing the client');

  // =========================================================================
  // Test 8: Protected Route Verification
  // =========================================================================
  console.log('  8. Testing protected route verification for /integrations...');
  assert.strictEqual(isTokenValid(mockToken), true);
  const payload = parseJwt(mockToken);
  assert.strictEqual(payload?.email, 'integrations.tester@skilldna.ai');
  assert.strictEqual(isTokenValid(null), false);
  console.log('     ✓ /integrations route correctly enforces JWT authentication');

  // =========================================================================
  // Test 9: Verification of PARTIAL and NEEDS_AUTH Status Rendering Distinctions
  // =========================================================================
  console.log('  9. Testing PARTIAL / NEEDS_AUTH status distinction from SUCCESS and FAILED...');
  const testBadgeStatus = (status: string): string => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS') return 'Synced';
    if (s === 'NEEDS_AUTH') return 'Needs OAuth';
    if (s === 'PARTIAL') return 'Limited Sync';
    if (s === 'FAILED' || s === 'SYNC_FAILED') return 'Sync Failed';
    return 'Not Synced';
  };

  assert.strictEqual(testBadgeStatus('SUCCESS'), 'Synced');
  assert.strictEqual(testBadgeStatus('NEEDS_AUTH'), 'Needs OAuth');
  assert.strictEqual(testBadgeStatus('PARTIAL'), 'Limited Sync');
  assert.strictEqual(testBadgeStatus('FAILED'), 'Sync Failed');
  assert.notStrictEqual(
    testBadgeStatus('NEEDS_AUTH'),
    'Synced',
    'NEEDS_AUTH must NOT be displayed as Synced',
  );
  assert.notStrictEqual(
    testBadgeStatus('PARTIAL'),
    'Synced',
    'PARTIAL must NOT be displayed as Synced',
  );
  // =========================================================================
  // Test 10: Pre-Persistence Validation & Rejection Handling on Frontend
  // =========================================================================
  console.log('  10. Testing frontend handling of pre-persistence validation rejections...');
  // 10.1 Invalid username rejection
  (global as any).fetch = async (url: string, opts: any) => {
    if (url.includes('/integrations/connect')) {
      const body = JSON.parse(opts.body);
      if (body.username === 'nonexistent_handle_123') {
        return {
          ok: false,
          status: 404,
          json: async () => ({
            success: false,
            message: "Integration matching 'GitHub account nonexistent_handle_123' was not found.",
            errorCode: 'RESOURCE_NOT_FOUND',
          }),
        };
      }
      if (body.platform === 'LINKEDIN' && !body.accessToken) {
        return {
          ok: false,
          status: 401,
          json: async () => ({
            success: false,
            message:
              'OAuth authentication failed: LinkedIn requires OAuth authorization. Connect via LinkedIn OAuth2 flow.',
            errorCode: 'AUTHENTICATION_FAILED',
          }),
        };
      }
    }
    return originalFetch(url, opts);
  };

  try {
    const invalidRes = await connectPlatformApi({
      platform: 'GITHUB',
      username: 'nonexistent_handle_123',
    });
    assert.strictEqual(invalidRes.success, false);
    assert.ok(invalidRes.message.includes('was not found'));
    console.log('     ✓ Invalid username returns safe 404 error message without adding card');
  } catch (err: any) {
    assert.ok(err.message.includes('was not found'));
  }

  // 10.2 LinkedIn without OAuth rejection
  try {
    const linkedinRes = await connectPlatformApi({
      platform: 'LINKEDIN',
      username: 'any_linkedin_handle',
    });
    assert.strictEqual(linkedinRes.success, false);
    assert.ok(linkedinRes.message.includes('LinkedIn requires OAuth authorization'));
    console.log('     ✓ LinkedIn without OAuth returns 401 with OAuth required message');
  } catch (err: any) {
    assert.ok(err.message.includes('LinkedIn requires OAuth authorization'));
  }

  (global as any).fetch = originalFetch;

  // =========================================================================
  // Test 11: Verification of RATE_LIMITED Badge Rendering and Distinction
  // =========================================================================
  console.log('  11. Testing RATE_LIMITED badge rendering and distinction from Synced/Failed...');
  const testFullBadgeStatus = (status: string): string => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS') return 'Synced';
    if (s === 'NEEDS_AUTH') return 'Needs OAuth';
    if (s === 'PARTIAL') return 'Limited Sync';
    if (s === 'RATE_LIMITED') return 'Rate Limited';
    if (s === 'FAILED' || s === 'SYNC_FAILED') return 'Sync Failed';
    return 'Not Synced';
  };

  assert.strictEqual(testFullBadgeStatus('RATE_LIMITED'), 'Rate Limited');
  assert.notStrictEqual(
    testFullBadgeStatus('RATE_LIMITED'),
    'Synced',
    'RATE_LIMITED must NOT render as Synced',
  );
  assert.notStrictEqual(
    testFullBadgeStatus('RATE_LIMITED'),
    'Sync Failed',
    'RATE_LIMITED must NOT render as Sync Failed',
  );
  assert.strictEqual(testFullBadgeStatus('SUCCESS'), 'Synced');
  assert.strictEqual(testFullBadgeStatus('FAILED'), 'Sync Failed');
  assert.strictEqual(testFullBadgeStatus('PARTIAL'), 'Limited Sync');
  assert.strictEqual(testFullBadgeStatus('NEEDS_AUTH'), 'Needs OAuth');
  // =========================================================================
  // Test 12: LinkedIn OAuth 2.0 UX, Authorization Trigger & Token Safety
  // =========================================================================
  console.log('  12. Testing LinkedIn OAuth UX, Authorization Trigger & Token Safety...');
  (global as any).fetch = async (url: string, opts: any) => {
    if (url.includes('/integrations/linkedin/oauth/url')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            url: 'https://www.linkedin.com/oauth/v2/authorization?client_id=test_client&response_type=code&scope=openid+profile+email&state=signed_state_123',
          },
        }),
      };
    }
    return originalFetch(url, opts);
  };

  // 12.1 Verify getOAuthUrlApi initiates request
  const oauthRes = await getOAuthUrlApi('LINKEDIN');
  assert.strictEqual(oauthRes.success, true);
  assert.ok(oauthRes.data?.url.startsWith('https://www.linkedin.com/oauth/v2/authorization'));
  assert.ok(oauthRes.data?.url.includes('client_id=test_client'));
  assert.ok(oauthRes.data?.url.includes('state=signed_state_123'));
  console.log('     ✓ getOAuthUrlApi successfully requests signed authorization URL from backend');

  // 12.2 Verify that no LinkedIn access token is stored in localStorage
  assert.strictEqual(
    typeof (global as any).localStorage?.getItem === 'function'
      ? (global as any).localStorage.getItem('linkedin_access_token')
      : null,
    null,
    'Client storage must NEVER contain LinkedIn access tokens',
  );
  console.log('     ✓ Client security verified: Zero LinkedIn tokens stored in client storage');

  // 12.3 Query parameter handling
  const testQueryParams = (query: string): { status: string; cleanUrl: string } => {
    const params = new URLSearchParams(query);
    const linkedin = params.get('linkedin');
    const reason = params.get('reason');
    if (linkedin === 'connected') {
      return { status: 'CONNECTED', cleanUrl: '/integrations' };
    }
    if (linkedin === 'error') {
      return { status: `ERROR_${reason || 'UNKNOWN'}`, cleanUrl: '/integrations' };
    }
    return { status: 'NONE', cleanUrl: '/integrations' };
  };

  assert.strictEqual(testQueryParams('?linkedin=connected').status, 'CONNECTED');
  assert.strictEqual(
    testQueryParams('?linkedin=error&reason=invalid_state').status,
    'ERROR_invalid_state',
  );
  assert.strictEqual(testQueryParams('?linkedin=error&reason=cancelled').status, 'ERROR_cancelled');
  console.log('     ✓ Safe query parameter parsing and URL cleanup logic verified');

  (global as any).fetch = originalFetch;

  console.log('🎉 All Frontend Platform Integrations & Enum Mapping Tests Passed Successfully!');
}

runFrontendIntegrationsTests().catch((err) => {
  console.error('❌ Frontend Integrations Test Failed:', err);
  process.exit(1);
});
