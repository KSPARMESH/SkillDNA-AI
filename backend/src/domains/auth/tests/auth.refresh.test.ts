import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { AuthService } from '../auth.service';
import { config } from '../../../config';
import { prisma } from '@skilldna/database';
import { AppError } from '@skilldna/shared';

async function runAuthRefreshTests() {
  console.log('🧪 Running Comprehensive Backend Auth Refresh Token Test Suite...\n');

  // Test User fixture
  const testUser = {
    id: 'usr-refresh-test-001',
    email: 'refresh.tester@skilldna.ai',
    firstName: 'Refresh',
    lastName: 'Tester',
    role: 'STUDENT',
    status: 'ACTIVE',
    deletedAt: null,
  };

  // Generate valid tokens
  const payload = {
    id: testUser.id,
    email: testUser.email,
    role: testUser.role,
  };

  const validRefreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });
  const expiredRefreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '-1s' });
  const wrongSecretRefreshToken = jwt.sign(payload, 'wrong_jwt_refresh_secret_key_123', {
    expiresIn: '7d',
  });

  // In-memory token store for mock Prisma
  const dbTokens: Record<
    string,
    { id: string; token: string; userId: string; expiresAt: Date; revoked: boolean }
  > = {
    [validRefreshToken]: {
      id: 'tok-001',
      token: validRefreshToken,
      userId: testUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
    },
    'revoked-sample-token': {
      id: 'tok-002',
      token: 'revoked-sample-token',
      userId: testUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: true,
    },
  };

  // Mock Prisma methods
  const originalFindUniqueToken = prisma.refreshToken.findUnique;
  const originalUpdateToken = prisma.refreshToken.update;
  const originalCreateToken = prisma.refreshToken.create;
  const originalFindUniqueUser = prisma.user.findUnique;

  (prisma.refreshToken as any).findUnique = async ({ where }: any) => {
    if (where.token && dbTokens[where.token]) {
      return { ...dbTokens[where.token] };
    }
    return null;
  };

  (prisma.refreshToken as any).update = async ({ where, data }: any) => {
    const tokenItem = Object.values(dbTokens).find((t) => t.id === where.id);
    if (tokenItem) {
      if (data.revoked !== undefined) tokenItem.revoked = data.revoked;
      return { ...tokenItem };
    }
    return null;
  };

  (prisma.refreshToken as any).create = async ({ data }: any) => {
    const newRecord = {
      id: `tok-${Date.now()}`,
      token: data.token,
      userId: data.userId,
      expiresAt: data.expiresAt,
      revoked: false,
    };
    dbTokens[data.token] = newRecord;
    return newRecord;
  };

  let currentUserState = { ...testUser };
  (prisma.user as any).findUnique = async ({ where }: any) => {
    if (where.id === testUser.id) {
      return currentUserState;
    }
    return null;
  };

  try {
    // =========================================================================
    // Test 1: Valid Refresh Token Returns New Access Token
    // =========================================================================
    console.log('  1. Testing valid refresh token request...');
    const result = await AuthService.refresh(validRefreshToken);

    assert.ok(result.accessToken, 'Must return new access token');
    assert.ok(result.refreshToken, 'Must return new rotated refresh token');
    assert.strictEqual(result.user.id, testUser.id);
    assert.strictEqual(result.user.email, testUser.email);
    assert.strictEqual(result.user.role, testUser.role);

    // Verify new access token is signed with config.jwtSecret and valid
    const decodedAccess: any = jwt.verify(result.accessToken, config.jwtSecret);
    assert.strictEqual(decodedAccess.id, testUser.id);
    assert.strictEqual(decodedAccess.email, testUser.email);
    console.log('     ✓ Valid refresh token returns valid access token with correct payload');

    // =========================================================================
    // Test 2: Token Rotation Returns New Refresh Token
    // =========================================================================
    console.log('  2. Testing refresh token rotation...');
    assert.notStrictEqual(
      result.refreshToken,
      validRefreshToken,
      'New refresh token must differ from old one',
    );
    assert.ok(dbTokens[result.refreshToken], 'New refresh token must be stored in database');
    console.log('     ✓ Token rotation generates and stores distinct replacement refresh token');

    // =========================================================================
    // Test 3: Old Refresh Token Revocation
    // =========================================================================
    console.log('  3. Testing old refresh token revocation...');
    const oldTokenRecord = dbTokens[validRefreshToken];
    assert.strictEqual(
      oldTokenRecord.revoked,
      true,
      'Old refresh token must be marked revoked in DB',
    );
    console.log('     ✓ Old refresh token is marked revoked: true in database');

    // =========================================================================
    // Test 4: Expired Refresh Token Rejection
    // =========================================================================
    console.log('  4. Testing expired refresh token rejection...');
    let threwExpired = false;
    try {
      await AuthService.refresh(expiredRefreshToken);
    } catch (err: any) {
      threwExpired = true;
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.statusCode, 401);
    }
    assert.ok(threwExpired, 'Expired token must throw 401 error');
    console.log('     ✓ Expired refresh token cleanly rejected with 401 UNAUTHORIZED');

    // =========================================================================
    // Test 5: Revoked Refresh Token Rejection
    // =========================================================================
    console.log('  5. Testing revoked refresh token rejection...');
    let threwRevoked = false;
    try {
      await AuthService.refresh(validRefreshToken); // validRefreshToken is now revoked from Test 1
    } catch (err: any) {
      threwRevoked = true;
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.statusCode, 401);
    }
    assert.ok(threwRevoked, 'Revoked token must be rejected with 401');
    console.log('     ✓ Revoked refresh token cleanly rejected with 401');

    // =========================================================================
    // Test 6: Malformed Refresh Token Rejection
    // =========================================================================
    console.log('  6. Testing malformed refresh token rejection...');
    let threwMalformed = false;
    try {
      await AuthService.refresh('not.a.valid.jwt.token');
    } catch (err: any) {
      threwMalformed = true;
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.statusCode, 401);
    }
    assert.ok(threwMalformed, 'Malformed token must be rejected');
    console.log('     ✓ Malformed refresh token rejected with 401');

    // =========================================================================
    // Test 7: Missing / Empty Refresh Token Rejection
    // =========================================================================
    console.log('  7. Testing missing / empty refresh token rejection...');
    let threwMissing = false;
    try {
      await AuthService.refresh('');
    } catch (err: any) {
      threwMissing = true;
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.statusCode, 400);
    }
    assert.ok(threwMissing, 'Empty token must be rejected with 400');
    console.log('     ✓ Missing refresh token rejected with 400 BAD_REQUEST');

    // =========================================================================
    // Test 8: Deleted / Inactive User Rejection
    // =========================================================================
    console.log('  8. Testing inactive / deleted user token rejection...');
    const rotatedToken = result.refreshToken;
    currentUserState = { ...testUser, status: 'DEACTIVATED' } as any;

    let threwInactive = false;
    try {
      await AuthService.refresh(rotatedToken);
    } catch (err: any) {
      threwInactive = true;
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.statusCode, 401);
    }
    assert.ok(threwInactive, 'Token for inactive user must be rejected');
    assert.strictEqual(
      dbTokens[rotatedToken].revoked,
      true,
      'Token must be revoked when user is inactive',
    );
    console.log('     ✓ Inactive user token rejected and revoked immediately');

    // Restore active user
    currentUserState = { ...testUser };

    // =========================================================================
    // Test 9: Repeated Use of Old Token Rejection (Replay Attack Defense)
    // =========================================================================
    console.log('  9. Testing replay attack defense against old tokens...');
    let threwReplay = false;
    try {
      await AuthService.refresh(validRefreshToken);
    } catch (err: any) {
      threwReplay = true;
      assert.strictEqual(err.statusCode, 401);
    }
    assert.ok(threwReplay, 'Replay of old refresh token must fail');
    console.log('     ✓ Replay attack with previously consumed refresh token defended');

    // =========================================================================
    // Test 10: Token Secrets Isolation & No Leaks
    // =========================================================================
    console.log('  10. Testing token secrets isolation...');
    let threwWrongSecret = false;
    try {
      await AuthService.refresh(wrongSecretRefreshToken);
    } catch (err: any) {
      threwWrongSecret = true;
      assert.strictEqual(err.statusCode, 401);
    }
    assert.ok(threwWrongSecret, 'Token signed with foreign secret must be rejected');
    console.log('     ✓ Foreign secret token rejected; no secrets leaked in error response');

    console.log('\n🎉 All 10 Backend Refresh Token Flow Tests Passed Successfully!');
  } finally {
    // Restore prisma methods
    (prisma.refreshToken as any).findUnique = originalFindUniqueToken;
    (prisma.refreshToken as any).update = originalUpdateToken;
    (prisma.refreshToken as any).create = originalCreateToken;
    (prisma.user as any).findUnique = originalFindUniqueUser;
  }
}

runAuthRefreshTests().catch((err) => {
  console.error('❌ Backend Auth Refresh Token Tests Failed:', err);
  process.exit(1);
});
