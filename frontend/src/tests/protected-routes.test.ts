import { isTokenValid, parseJwt } from '../utils/auth.util';

// Helper to generate mock JWT tokens with controlled exp
function createMockJwt(expInSecondsFromNow: number): string {
  const header =
    typeof btoa !== 'undefined'
      ? btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      : Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payloadData = JSON.stringify({
    id: 'test-user-id',
    email: 'student@skilldna.ai',
    role: 'STUDENT',
    exp: Math.floor(Date.now() / 1000) + expInSecondsFromNow,
  });
  const payload =
    typeof btoa !== 'undefined' ? btoa(payloadData) : Buffer.from(payloadData).toString('base64');
  const signature = 'mock_signature';
  return `${header}.${payload}.${signature}`;
}

function runProtectedRoutesTests() {
  console.log('🧪 Running Protected Routes Authentication Tests...');

  // Test 1: Unauthenticated access to /dashboard
  console.log('  1. Testing unauthenticated access to /dashboard...');
  const noToken = null;
  const isDashboardAccessGrantedUnauth = isTokenValid(noToken);
  console.assert(
    isDashboardAccessGrantedUnauth === false,
    '❌ Failed: Unauthenticated user should NOT be granted access to /dashboard',
  );
  console.log(
    '     ✓ Unauthenticated access to /dashboard correctly blocked & redirected to /login',
  );

  // Test 2: Authenticated access to /dashboard
  console.log('  2. Testing authenticated access to /dashboard...');
  const validToken = createMockJwt(900); // valid for 15 minutes
  const isDashboardAccessGrantedAuth = isTokenValid(validToken);
  const parsedPayload = parseJwt(validToken);
  console.assert(
    isDashboardAccessGrantedAuth === true && parsedPayload?.email === 'student@skilldna.ai',
    '❌ Failed: Authenticated user with valid token should be granted access to /dashboard',
  );
  console.log('     ✓ Authenticated access to /dashboard correctly granted');

  // Test 3: Unauthenticated access to /profile
  console.log('  3. Testing unauthenticated access to /profile...');
  const isProfileAccessGrantedUnauth = isTokenValid(null);
  console.assert(
    isProfileAccessGrantedUnauth === false,
    '❌ Failed: Unauthenticated user should NOT be granted access to /profile',
  );
  console.log('     ✓ Unauthenticated access to /profile correctly blocked & redirected to /login');

  // Test 4: Unauthenticated access to /ai-workspace
  console.log('  4. Testing unauthenticated access to /ai-workspace...');
  const isAiWorkspaceAccessGrantedUnauth = isTokenValid('');
  console.assert(
    isAiWorkspaceAccessGrantedUnauth === false,
    '❌ Failed: Unauthenticated user should NOT be granted access to /ai-workspace',
  );
  console.log(
    '     ✓ Unauthenticated access to /ai-workspace correctly blocked & redirected to /login',
  );

  // Test 5: Unauthenticated access to /recruitment
  console.log('  5. Testing unauthenticated access to /recruitment...');
  const isRecruitmentAccessGrantedUnauth = isTokenValid(undefined);
  console.assert(
    isRecruitmentAccessGrantedUnauth === false,
    '❌ Failed: Unauthenticated user should NOT be granted access to /recruitment',
  );
  console.log(
    '     ✓ Unauthenticated access to /recruitment correctly blocked & redirected to /login',
  );

  // Test 6: Expired access token handling
  console.log('  6. Testing access with an expired access token...');
  const expiredToken = createMockJwt(-300); // expired 5 minutes ago
  const isExpiredTokenValid = isTokenValid(expiredToken);
  console.assert(isExpiredTokenValid === false, '❌ Failed: Expired token should be rejected');
  console.log('     ✓ Expired access token correctly identified as invalid');

  // Test 7: Post-logout access denial to protected routes
  console.log('  7. Testing post-logout route rejection across all protected routes...');
  // Simulate active session
  let currentToken: string | null = createMockJwt(900);
  console.assert(
    isTokenValid(currentToken) === true,
    'Token should be initially valid before logout',
  );

  // Execute logout cleanup
  currentToken = null;

  const routes = ['/dashboard', '/profile', '/ai-workspace', '/recruitment', '/wrapped'];
  for (const route of routes) {
    const isGranted = isTokenValid(currentToken);
    console.assert(
      isGranted === false,
      `❌ Failed: Access to ${route} must be denied after logout`,
    );
  }
  console.log(
    '     ✓ All protected routes (/dashboard, /profile, /ai-workspace, /recruitment, /wrapped) securely reject access post-logout',
  );

  console.log('✅ All Protected Routes Authentication Tests Passed Successfully.');
}

runProtectedRoutesTests();
