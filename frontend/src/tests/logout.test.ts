import assert from 'node:assert';
import {
  isTokenValid,
  getStoredAccessToken,
  getStoredRefreshToken,
  clearAuthTokens,
} from '../utils/auth.util';
import { logoutApi } from '../services/api.service';

type EventCallback = () => void;

// Mock localStorage environment for Node / testing environment
const mockStorage: Record<string, string> = {};
const mockEventListeners: Record<string, EventCallback[]> = {};

(global as any).window = {
  location: { href: '', pathname: '/dashboard' },
  addEventListener: (event: string, cb: EventCallback) => {
    mockEventListeners[event] = mockEventListeners[event] || [];
    mockEventListeners[event].push(cb);
  },
  removeEventListener: (event: string, cb: EventCallback) => {
    if (mockEventListeners[event]) {
      mockEventListeners[event] = mockEventListeners[event].filter((fn) => fn !== cb);
    }
  },
  dispatchEvent: (event: { type: string }) => {
    if (mockEventListeners[event.type]) {
      mockEventListeners[event.type].forEach((cb) => cb());
    }
    return true;
  },
};

(global as any).Event = class Event {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
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
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
  },
};

function createMockJwt(expInSecondsFromNow: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payloadData = JSON.stringify({
    id: 'usr-logout-test-id',
    email: 'frontend.tester@skilldna.ai',
    role: 'STUDENT',
    exp: Math.floor(Date.now() / 1000) + expInSecondsFromNow,
  });
  const payload = Buffer.from(payloadData).toString('base64');
  const signature = 'mock_signature_hash';
  return `${header}.${payload}.${signature}`;
}

async function runFrontendLogoutTests() {
  console.log('🧪 Running Comprehensive Frontend Logout Authentication Tests...');

  // Setup initial logged-in state
  const mockAccessToken = createMockJwt(900); // 15 mins
  const mockRefreshToken = createMockJwt(604800); // 7 days

  localStorage.setItem('accessToken', mockAccessToken);
  localStorage.setItem('refreshToken', mockRefreshToken);

  // Test 1: Verify Initial Authenticated State
  console.log('  1. Testing initial authenticated state in storage...');
  assert.strictEqual(getStoredAccessToken(), mockAccessToken, 'Access token should be stored');
  assert.strictEqual(getStoredRefreshToken(), mockRefreshToken, 'Refresh token should be stored');
  assert.strictEqual(isTokenValid(getStoredAccessToken()), true, 'Access token should be valid');
  console.log('     ✓ Authenticated state successfully established');

  // Test 2: Token cleanup & Auth State Event
  console.log('  2. Testing clearAuthTokens and event dispatch...');
  let eventDispatched = false;
  window.addEventListener('auth-state-change', () => {
    eventDispatched = true;
  });

  clearAuthTokens();

  assert.strictEqual(localStorage.getItem('accessToken'), null, 'accessToken should be removed');
  assert.strictEqual(localStorage.getItem('refreshToken'), null, 'refreshToken should be removed');
  assert.strictEqual(getStoredAccessToken(), null, 'getStoredAccessToken should return null');
  assert.strictEqual(getStoredRefreshToken(), null, 'getStoredRefreshToken should return null');
  assert.strictEqual(eventDispatched, true, 'auth-state-change event must be dispatched');
  console.log('     ✓ Tokens cleared and auth-state-change event dispatched successfully');

  // Test 3: Protected Route Denial After Logout
  console.log('  3. Testing protected route rejection after token removal...');
  const postLogoutToken = getStoredAccessToken();
  const isDashboardAccessAllowed = isTokenValid(postLogoutToken);
  assert.strictEqual(isDashboardAccessAllowed, false, 'Protected route access must be denied');
  console.log('     ✓ Protected route access denied after logout');

  // Test 4: Safe Logout on Backend API Network Failure
  console.log('  4. Testing safe local cleanup during API network/server failure...');
  // Restore tokens
  localStorage.setItem('accessToken', mockAccessToken);
  localStorage.setItem('refreshToken', mockRefreshToken);
  assert.ok(getStoredAccessToken(), 'Token restored for failure test');

  // Mock global fetch to simulate network error or 500 internal server error
  (global as any).fetch = async () => {
    throw new Error('Network offline or backend service temporarily unreachable');
  };

  const logoutResponse = await logoutApi();
  assert.strictEqual(logoutResponse.success, false, 'Should return failure status gracefully');
  assert.strictEqual(
    localStorage.getItem('accessToken'),
    null,
    'accessToken MUST still be cleared from localStorage on network failure',
  );
  assert.strictEqual(
    localStorage.getItem('refreshToken'),
    null,
    'refreshToken MUST still be cleared from localStorage on network failure',
  );
  assert.strictEqual(
    getStoredAccessToken(),
    null,
    'User must be completely unauthenticated in browser despite network failure',
  );
  console.log('     ✓ Safe failure handling verified: local auth tokens unconditionally cleared');

  // Test 5: Safe Logout on Backend 200 Success Response
  console.log('  5. Testing logoutApi with successful backend response...');
  localStorage.setItem('accessToken', mockAccessToken);
  localStorage.setItem('refreshToken', mockRefreshToken);

  (global as any).fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      statusCode: 200,
      message: 'Logged out successfully.',
      data: null,
    }),
  });

  const successResponse = await logoutApi();
  assert.strictEqual(successResponse.success, true);
  assert.strictEqual(getStoredAccessToken(), null);
  assert.strictEqual(getStoredRefreshToken(), null);
  console.log('     ✓ Successful logoutApi execution verified');

  console.log('🎉 All Frontend Logout Authentication Tests Passed Successfully!');
}

runFrontendLogoutTests().catch((err) => {
  console.error('❌ Frontend Logout Test Failed:', err);
  process.exit(1);
});
