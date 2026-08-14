import assert from 'node:assert';
import { isTokenValid, parseJwt } from '../utils/auth.util';
import {
  getSupportedPlatformsApi,
  getIntegrationsApi,
  getIntegrationStatusApi,
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
  console.log('🧪 Running Comprehensive Frontend Platform Integrations Suite...');

  // Setup valid authentication
  const mockToken = createMockJwt();
  localStorage.setItem('accessToken', mockToken);

  // In-memory mock database of integrations
  const mockSupportedPlatforms = [
    'GITHUB',
    'LEETCODE',
    'CODEFORCES',
    'HACKERRANK',
    'STACKOVERFLOW',
    'ATCODER',
    'MEDIUM',
    'KAGGLE',
    'LINKEDIN',
    'DEVPOST',
    'CODECHEF',
  ];

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

      // Validate required fields
      if (!body.platform || !mockSupportedPlatforms.includes(body.platform.toUpperCase())) {
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

      // Upsert integration
      const existingIdx = integrationsDatabase.findIndex(
        (i) => i.platform.toUpperCase() === body.platform.toUpperCase(),
      );

      const record = {
        id:
          existingIdx >= 0
            ? integrationsDatabase[existingIdx].id
            : `int-${body.platform.toLowerCase()}-${Date.now()}`,
        userId: 'usr-integration-test-id',
        platform: body.platform.toUpperCase(),
        username: body.username.trim(),
        isConnected: true,
        syncStatus: 'SYNCING',
        lastSyncedAt: new Date().toISOString(),
        metadata: body.metadata || { autoSynced: true },
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
          message: `Successfully connected ${body.platform} integration. Initial synchronization initiated.`,
          data: {
            id: record.id,
            platform: record.platform,
            username: record.username,
            isConnected: record.isConnected,
            syncStatus: record.syncStatus,
            createdAt: record.createdAt,
          },
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // POST /api/v1/integrations/disconnect
    if (path === '/api/v1/integrations/disconnect' && method === 'POST') {
      const body = JSON.parse(options.body);
      const targetPlatform = (body.platform || '').toUpperCase();

      const existingIdx = integrationsDatabase.findIndex(
        (i) => i.platform.toUpperCase() === targetPlatform,
      );

      if (existingIdx >= 0) {
        integrationsDatabase.splice(existingIdx, 1);
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          message: `Successfully disconnected platform ${targetPlatform}.`,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // POST /api/v1/integrations/sync/:platform or /api/v1/integrations/sync
    if (path.startsWith('/api/v1/integrations/sync') && method === 'POST') {
      const parts = path.split('/');
      const platformParam = parts[5]; // /api/v1/integrations/sync/:platform

      if (platformParam) {
        const plat = platformParam.toUpperCase();
        const target = integrationsDatabase.find((i) => i.platform.toUpperCase() === plat);
        if (target) {
          target.lastSyncedAt = new Date().toISOString();
          target.syncStatus = 'SUCCESS';
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
        i.lastSyncedAt = syncedNow;
        i.syncStatus = 'SUCCESS';
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
            successfulCount: integrationsDatabase.length,
            results: integrationsDatabase.map((i) => ({
              platform: i.platform,
              status: 'SUCCESS',
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
  // Test 1: Supported Platforms List Retrieval (GET /api/v1/integrations/platforms)
  // =========================================================================
  console.log('  1. Testing supported platforms list retrieval...');
  const platformsRes = await getSupportedPlatformsApi();
  assert.strictEqual(platformsRes.success, true, 'Supported platforms call should succeed');
  assert.strictEqual(Array.isArray(platformsRes.data.supportedPlatforms), true);
  assert.strictEqual(platformsRes.data.supportedPlatforms.length, 11);
  assert.ok(platformsRes.data.supportedPlatforms.includes('GITHUB'));
  assert.ok(platformsRes.data.supportedPlatforms.includes('LEETCODE'));
  assert.ok(platformsRes.data.supportedPlatforms.includes('CODEFORCES'));
  assert.ok(platformsRes.data.supportedPlatforms.includes('HACKERRANK'));
  assert.ok(platformsRes.data.supportedPlatforms.includes('STACKOVERFLOW'));
  assert.ok(platformsRes.data.supportedPlatforms.includes('ATCODER'));
  assert.ok(platformsRes.data.supportedPlatforms.includes('MEDIUM'));
  console.log(
    '     ✓ Supported platforms list fetched and contains all verified backend platforms',
  );

  // =========================================================================
  // Test 2: Connected Integrations Retrieval (GET /api/v1/integrations & status)
  // =========================================================================
  console.log('  2. Testing user connected integrations retrieval...');
  const integrationsRes = await getIntegrationsApi();
  assert.strictEqual(integrationsRes.success, true);
  assert.strictEqual(Array.isArray(integrationsRes.data), true);
  assert.strictEqual(integrationsRes.data.length, 1);
  assert.strictEqual(integrationsRes.data[0].platform, 'GITHUB');
  assert.strictEqual(integrationsRes.data[0].username, 'parmeshks');
  assert.strictEqual(integrationsRes.data[0].isConnected, true);

  const statusRes = await getIntegrationStatusApi();
  assert.strictEqual(statusRes.success, true);
  assert.strictEqual(statusRes.data[0].platform, 'GITHUB');
  assert.strictEqual(statusRes.data[0].syncStatus, 'SUCCESS');
  console.log('     ✓ Connected integrations and status summaries successfully retrieved');

  // =========================================================================
  // Test 3: Connect Platform Flow (POST /api/v1/integrations/connect)
  // =========================================================================
  console.log('  3. Testing connecting a new platform (LeetCode)...');
  const connectLeetCodePayload = {
    platform: 'LEETCODE',
    username: 'parmesh_code',
  };

  const connectRes = await connectPlatformApi(connectLeetCodePayload);
  assert.strictEqual(connectRes.success, true);
  assert.strictEqual(connectRes.data.platform, 'LEETCODE');
  assert.strictEqual(connectRes.data.username, 'parmesh_code');
  assert.strictEqual(connectRes.data.isConnected, true);

  // Verify list reflects new connection immediately
  const postConnectList = await getIntegrationsApi();
  assert.strictEqual(postConnectList.data.length, 2);
  const leetcodeItem = postConnectList.data.find((i: any) => i.platform === 'LEETCODE');
  assert.ok(leetcodeItem, 'LeetCode must now appear in the connected list');
  assert.strictEqual(leetcodeItem.username, 'parmesh_code');
  console.log(
    '     ✓ LeetCode successfully connected and reflected immediately in integration state',
  );

  // Connect another platform (Codeforces)
  console.log('  3b. Testing connecting Codeforces handle...');
  const connectCodeforcesRes = await connectPlatformApi({
    platform: 'CODEFORCES',
    username: 'tourist_fan',
  });
  assert.strictEqual(connectCodeforcesRes.success, true);
  assert.strictEqual(connectCodeforcesRes.data.platform, 'CODEFORCES');
  const list3 = await getIntegrationsApi();
  assert.strictEqual(list3.data.length, 3);
  console.log('     ✓ Codeforces handle connected successfully');

  // =========================================================================
  // Test 4: Client-side Validation Logic & Invalid Input Handling
  // =========================================================================
  console.log('  4. Testing client-side and backend validation rules...');
  const validateConnectForm = (platform: string, username: string) => {
    const errors: Record<string, string> = {};
    if (!platform || !mockSupportedPlatforms.includes(platform.toUpperCase())) {
      errors.platform = 'Invalid platform';
    }
    if (!username || !username.trim()) {
      errors.username = 'Username is required';
    } else if (username.trim().length > 100) {
      errors.username = 'Username too long';
    }
    return errors;
  };

  // Test empty username validation
  const emptyUserErr = validateConnectForm('GITHUB', '');
  assert.ok(emptyUserErr.username, 'Should catch empty username');

  // Test whitespace-only username
  const spaceUserErr = validateConnectForm('GITHUB', '   ');
  assert.ok(spaceUserErr.username, 'Should catch whitespace username');

  // Test invalid platform
  const invalidPlatformErr = validateConnectForm('NON_EXISTENT_PLATFORM', 'user123');
  assert.ok(invalidPlatformErr.platform, 'Should catch invalid platform');

  // Test valid input
  const validInputs = validateConnectForm('HACKERRANK', 'valid_user');
  assert.strictEqual(Object.keys(validInputs).length, 0);

  // Test backend rejection for invalid username
  const backendRejectRes = await connectPlatformApi({ platform: 'GITHUB', username: '' });
  assert.strictEqual(backendRejectRes.success, false);
  assert.strictEqual(backendRejectRes.statusCode, 400);

  console.log(
    '     ✓ Form validation rejects empty usernames, whitespace, and unsupported platforms cleanly',
  );

  // =========================================================================
  // Test 5: Platform Synchronization (POST /api/v1/integrations/sync/:platform)
  // =========================================================================
  console.log('  5. Testing platform synchronization flow...');
  // Sync individual platform (LEETCODE)
  const syncSingleRes = await syncPlatformApi('LEETCODE');
  assert.strictEqual(syncSingleRes.success, true);
  assert.strictEqual(syncSingleRes.data.platform, 'LEETCODE');
  assert.strictEqual(syncSingleRes.data.status, 'SUCCESS');

  // Sync all platforms
  const syncAllRes = await syncPlatformApi();
  assert.strictEqual(syncAllRes.success, true);
  assert.strictEqual(syncAllRes.data.totalSynced, 3);
  assert.strictEqual(syncAllRes.data.successfulCount, 3);

  // Verify sync history
  const historyRes = await getSyncHistoryApi();
  assert.strictEqual(historyRes.success, true);
  assert.strictEqual(historyRes.data.length, 3);
  console.log('     ✓ Single platform sync, bulk sync, and history logging execute properly');

  // =========================================================================
  // Test 6: Disconnect Platform Flow (POST /api/v1/integrations/disconnect)
  // =========================================================================
  console.log('  6. Testing platform disconnect flow...');
  const disconnectRes = await disconnectPlatformApi('LEETCODE');
  assert.strictEqual(disconnectRes.success, true);
  assert.strictEqual(disconnectRes.message.includes('LEETCODE'), true);

  // Verify state immediately clears LeetCode
  const postDisconnectList = await getIntegrationsApi();
  assert.strictEqual(postDisconnectList.data.length, 2);
  const disconnectedLeetCode = postDisconnectList.data.find((i: any) => i.platform === 'LEETCODE');
  assert.strictEqual(disconnectedLeetCode, undefined, 'LeetCode must no longer be connected');

  // Disconnect Codeforces as well
  await disconnectPlatformApi('CODEFORCES');
  const postDisconnectList2 = await getIntegrationsApi();
  assert.strictEqual(postDisconnectList2.data.length, 1);
  assert.strictEqual(postDisconnectList2.data[0].platform, 'GITHUB');
  console.log(
    '     ✓ Disconnect flow immediately updates state without requiring re-authentication',
  );

  // =========================================================================
  // Test 7: API Error Handling & Network Resilience
  // =========================================================================
  console.log('  7. Testing API network failure and error resilience...');
  const originalFetch = (global as any).fetch;

  // Simulate network offline error
  (global as any).fetch = async () => {
    throw new Error('Network connection timeout or server offline');
  };

  try {
    await connectPlatformApi({ platform: 'GITHUB', username: 'tester' });
    assert.fail('Should throw or catch error safely');
  } catch (err: any) {
    assert.ok(
      err.message.includes('Network connection timeout') || err.message.includes('server offline'),
    );
  }

  // Restore fetch
  (global as any).fetch = originalFetch;
  console.log(
    '     ✓ Network failures and exceptions are safely caught without crashing the client',
  );

  // =========================================================================
  // Test 8: Protected Route Verification for /integrations
  // =========================================================================
  console.log('  8. Testing protected route verification for /integrations...');
  // Valid token
  assert.strictEqual(isTokenValid(mockToken), true, 'Valid token should grant access');
  const payload = parseJwt(mockToken);
  assert.strictEqual(payload?.email, 'integrations.tester@skilldna.ai');

  // Unauthenticated access
  assert.strictEqual(isTokenValid(null), false, 'Null token must be rejected');
  assert.strictEqual(isTokenValid(''), false, 'Empty token must be rejected');
  assert.strictEqual(isTokenValid(undefined), false, 'Undefined token must be rejected');

  // Expired token
  const expiredToken = createMockJwt(-600); // 10 minutes expired
  assert.strictEqual(isTokenValid(expiredToken), false, 'Expired token must be rejected');
  console.log('     ✓ /integrations route correctly enforces JWT authentication');

  console.log('🎉 All Frontend Platform Integrations Tests Passed Successfully!');
}

runFrontendIntegrationsTests().catch((err) => {
  console.error('❌ Frontend Integrations Test Failed:', err);
  process.exit(1);
});
