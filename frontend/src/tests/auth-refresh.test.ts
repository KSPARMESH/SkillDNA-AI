import assert from 'node:assert';
import { isTokenValid, setAuthTokens } from '../utils/auth.util';
import { fetchApi, logoutApi, refreshAccessTokenApi } from '../services/api.service';

// Mock storage and browser environment
let mockStorage: Record<string, string> = {};
let dispatchedEvents: string[] = [];

(global as any).window = {
  location: { href: '', pathname: '/dashboard' },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: (event: any) => {
    dispatchedEvents.push(event.type);
    return true;
  },
};

(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    mockStorage = {};
  },
};

function createMockJwt(expInSecondsFromNow = 900, id = 'usr-front-refresh-001'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadData = JSON.stringify({
    id,
    email: 'frontend.tester@skilldna.ai',
    role: 'STUDENT',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expInSecondsFromNow,
  });
  const payload = Buffer.from(payloadData).toString('base64url');
  const signature = 'mock_sig_' + Math.random().toString(36).substring(7);
  return `${header}.${payload}.${signature}`;
}

async function runFrontendAuthRefreshTests() {
  console.log('🧪 Running Comprehensive Frontend Auth Refresh & Interceptor Test Suite...\n');

  const validAccessToken = createMockJwt(900); // 15m
  const expiredAccessToken = createMockJwt(-60); // expired 1m ago
  const validRefreshToken = createMockJwt(7 * 24 * 3600); // 7d
  const rotatedAccessToken = createMockJwt(900);
  const rotatedRefreshToken = createMockJwt(7 * 24 * 3600);

  // Setup initial storage state
  mockStorage = {};
  dispatchedEvents = [];
  setAuthTokens(expiredAccessToken, validRefreshToken);

  let refreshCallCount = 0;
  let profileCallCount = 0;

  // Mock global fetch router with realistic async micro-delays
  (global as any).fetch = async (url: string, options: any = {}) => {
    await new Promise((resolve) => setTimeout(resolve, 15));
    const parsedUrl = new URL(url, 'http://localhost:5000');
    const path = parsedUrl.pathname;
    const method = options.method || 'GET';
    const authHeader = options.headers?.Authorization;

    if (path === '/api/v1/auth/refresh' && method === 'POST') {
      refreshCallCount++;
      const body = JSON.parse(options.body || '{}');

      if (body.refreshToken === validRefreshToken || body.refreshToken === rotatedRefreshToken) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            statusCode: 200,
            message: 'Token refreshed successfully.',
            data: {
              accessToken: rotatedAccessToken,
              refreshToken: rotatedRefreshToken,
              user: {
                id: 'usr-front-refresh-001',
                email: 'frontend.tester@skilldna.ai',
                role: 'STUDENT',
              },
            },
          }),
        };
      }

      return {
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          statusCode: 401,
          message: 'Invalid refresh token.',
        }),
      };
    }

    if (path === '/api/v1/users/me' && method === 'GET') {
      profileCallCount++;
      // If client sends rotated access token, accept it
      if (authHeader === `Bearer ${rotatedAccessToken}`) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            statusCode: 200,
            data: { id: 'usr-front-refresh-001', firstName: 'Alice', lastName: 'Tester' },
          }),
        };
      }

      // If client sends expired access token, reject with 401
      return {
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          statusCode: 401,
          message: 'Access token expired.',
        }),
      };
    }

    if (path === '/api/v1/auth/logout' && method === 'POST') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          message: 'Logged out successfully.',
        }),
      };
    }

    throw new Error(`Unhandled route ${method} ${path}`);
  };

  // =========================================================================
  // Test 1: Normal Authenticated API Request
  // =========================================================================
  console.log('  1. Testing normal API request handling...');
  setAuthTokens(rotatedAccessToken, rotatedRefreshToken);
  const normalRes = await fetchApi('/users/me');
  assert.strictEqual(normalRes.success, true);
  assert.strictEqual(normalRes.data.firstName, 'Alice');
  console.log('     ✓ Normal valid token request succeeds without refresh trigger');

  // =========================================================================
  // Test 2 & 3: 401 Triggers Automatic Refresh & Retries Original Request Once
  // =========================================================================
  console.log('  2 & 3. Testing 401 interceptor: triggers refresh and retries request...');
  // Reset tokens to expired access token + valid refresh token
  setAuthTokens(expiredAccessToken, validRefreshToken);
  refreshCallCount = 0;
  profileCallCount = 0;

  const retryRes = await fetchApi('/users/me');

  assert.strictEqual(retryRes.success, true, 'Request should succeed after transparent retry');
  assert.strictEqual(retryRes.data.firstName, 'Alice');
  assert.strictEqual(refreshCallCount, 1, 'Refresh endpoint must be called exactly once');
  assert.strictEqual(
    profileCallCount,
    2,
    'Original request must be called twice (initial 401 + retry 200)',
  );
  console.log('     ✓ 401 automatically triggered refresh and successfully retried request once');

  // =========================================================================
  // Test 4: New Tokens Stored in LocalStorage
  // =========================================================================
  console.log('  4. Testing updated tokens storage in localStorage...');
  assert.strictEqual(mockStorage['accessToken'], rotatedAccessToken);
  assert.strictEqual(mockStorage['refreshToken'], rotatedRefreshToken);
  console.log('     ✓ Rotated accessToken and refreshToken stored in localStorage');

  // =========================================================================
  // Test 5 & 6: Refresh Failure Clears Auth and Redirects to /login
  // =========================================================================
  console.log('  5 & 6. Testing refresh failure handling and redirect...');
  // Set invalid refresh token
  mockStorage['accessToken'] = expiredAccessToken;
  mockStorage['refreshToken'] = 'invalid_corrupt_refresh_token';
  dispatchedEvents = [];
  window.location.href = '';

  const failRes = await fetchApi('/users/me');
  assert.strictEqual(failRes.success, false);
  assert.strictEqual(
    mockStorage['accessToken'],
    undefined,
    'Access token must be cleared on failed refresh',
  );
  assert.strictEqual(
    mockStorage['refreshToken'],
    undefined,
    'Refresh token must be cleared on failed refresh',
  );
  assert.ok(
    dispatchedEvents.includes('auth-state-change'),
    'auth-state-change event must be dispatched',
  );
  assert.strictEqual(window.location.href, '/login', 'User must be redirected to /login');
  console.log('     ✓ Failed refresh clears tokens, dispatches event, and redirects to /login');

  // =========================================================================
  // Test 7: Simultaneous 401 Requests Share Single Refresh Call (Single-Flight)
  // =========================================================================
  console.log('  7. Testing single-flight shared promise on concurrent 401 requests...');
  setAuthTokens(expiredAccessToken, validRefreshToken);
  refreshCallCount = 0;
  profileCallCount = 0;

  const [res1, res2, res3, res4] = await Promise.all([
    fetchApi('/users/me'),
    fetchApi('/users/me'),
    fetchApi('/users/me'),
    fetchApi('/users/me'),
  ]);

  assert.strictEqual(res1.success, true);
  assert.strictEqual(res2.success, true);
  assert.strictEqual(res3.success, true);
  assert.strictEqual(res4.success, true);
  assert.strictEqual(
    refreshCallCount,
    1,
    'Multiple simultaneous 401s must share exactly ONE in-flight refresh call',
  );
  console.log('     ✓ 4 concurrent 401 requests deduplicated to exactly 1 /auth/refresh API call');

  // =========================================================================
  // Test 8: Refresh Endpoint Itself Never Causes Recursive Refresh
  // =========================================================================
  console.log('  8. Testing recursive refresh prevention on /auth/refresh endpoint...');
  mockStorage['refreshToken'] = 'invalid_token';
  let recursiveCount = 0;
  const originalFetch = (global as any).fetch;

  (global as any).fetch = async (url: string, options: any = {}) => {
    if (url.includes('/auth/refresh')) {
      recursiveCount++;
      return {
        ok: false,
        status: 401,
        json: async () => ({ success: false, statusCode: 401, message: 'Invalid' }),
      };
    }
    return originalFetch(url, options);
  };

  const refreshDirectRes = await refreshAccessTokenApi();
  assert.strictEqual(refreshDirectRes, null);
  assert.strictEqual(recursiveCount, 1, 'Refresh call must not recursively retry itself');
  (global as any).fetch = originalFetch;
  console.log('     ✓ Refresh endpoint safely handled without recursion');

  // =========================================================================
  // Test 9: Logout Clears All Tokens
  // =========================================================================
  console.log('  9. Testing logout token cleanup...');
  setAuthTokens(rotatedAccessToken, rotatedRefreshToken);
  await logoutApi();
  assert.strictEqual(mockStorage['accessToken'], undefined);
  assert.strictEqual(mockStorage['refreshToken'], undefined);
  console.log('     ✓ Logout cleanly clears both accessToken and refreshToken');

  // =========================================================================
  // Test 10: Protected Routes Behavior Verification
  // =========================================================================
  console.log('  10. Testing token validation utility for protected routes...');
  assert.strictEqual(isTokenValid(validAccessToken), true);
  assert.strictEqual(isTokenValid(expiredAccessToken), false);
  assert.strictEqual(isTokenValid(null), false);
  assert.strictEqual(isTokenValid(''), false);
  console.log('     ✓ Protected route token validation rules verified');

  console.log('\n🎉 All 10 Frontend Auth Refresh & Interceptor Tests Passed Successfully!');
}

runFrontendAuthRefreshTests().catch((err) => {
  console.error('❌ Frontend Auth Refresh Tests Failed:', err);
  process.exit(1);
});
