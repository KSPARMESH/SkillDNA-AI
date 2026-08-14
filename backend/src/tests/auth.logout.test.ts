import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@skilldna/database';
import { AuthService } from '../domains/auth/auth.service';
import { AuthController } from '../domains/auth/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { config } from '../config';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

function createMockExpressContext(authHeader?: string, body: any = {}) {
  const req = {
    headers: {
      ...(authHeader ? { authorization: authHeader } : {}),
    },
    body,
    user: undefined,
  } as unknown as Request;

  let statusCode = 200;
  let jsonResponse: any = null;
  let errorPassedToNext: any = null;

  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      jsonResponse = data;
      return res;
    },
  } as unknown as Response;

  const next: NextFunction = (err?: any) => {
    if (err) {
      errorPassedToNext = err;
    }
  };

  return {
    req,
    res,
    next,
    getStatusCode: () => statusCode,
    getResponse: () => jsonResponse,
    getError: () => errorPassedToNext,
  };
}

async function testAuthLogout() {
  console.log('🧪 Running Comprehensive Backend Logout Authentication Tests...');

  // Step 1: Create a test user in DB
  const testEmail = `logout.test.${Date.now()}@skilldna.ai`;
  console.log(`  Setting up test user: ${testEmail}`);
  const registerResult = await AuthService.register({
    email: testEmail,
    password: 'LogoutPassword123!',
    firstName: 'Logout',
    lastName: 'Tester',
  });

  const userId = registerResult.user.id;
  const validAccessToken = registerResult.accessToken;
  const validRefreshToken = registerResult.refreshToken;

  assert.ok(userId, 'Test user should have an ID');
  assert.ok(validAccessToken, 'Test user should have an access token');
  assert.ok(validRefreshToken, 'Test user should have a refresh token');

  // Verify that a RefreshToken record exists in the database
  const initialRefreshTokens = await prisma.refreshToken.findMany({
    where: { userId, revoked: false },
  });
  console.log(
    `  Found ${initialRefreshTokens.length} active refresh token(s) in database for user.`,
  );

  // Create an explicit mock UserSession to test session termination
  const testSessionToken = `session_token_${Date.now()}`;
  await prisma.userSession.create({
    data: {
      userId,
      sessionToken: testSessionToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const sessionsBefore = await prisma.userSession.count({ where: { userId } });
  assert.strictEqual(sessionsBefore, 1, 'Should have 1 active user session before logout');

  // Test Case 1: Unauthenticated Logout (Missing Authorization Header)
  {
    console.log('  1. Testing unauthenticated logout (missing token)...');
    const ctx = createMockExpressContext(undefined);
    authenticate(ctx.req, ctx.res, ctx.next);

    const err = ctx.getError();
    assert.ok(err instanceof AppError, 'Missing auth header should yield AppError');
    assert.strictEqual(err.statusCode, HttpStatusCode.UNAUTHORIZED, 'Should return 401');
    assert.strictEqual(err.errorCode, ApiErrorCode.AUTHENTICATION_FAILED);
    console.log('     ✓ Unauthenticated logout correctly rejected with 401 UNAUTHORIZED');
  }

  // Test Case 2: Invalid/Expired Token Logout
  {
    console.log('  2. Testing logout with invalid/expired tokens...');

    // 2a: Expired token
    const expiredToken = jwt.sign(
      { id: userId, email: testEmail, role: 'STUDENT' },
      config.jwtSecret,
      { expiresIn: '-10s' },
    );
    const ctxExpired = createMockExpressContext(`Bearer ${expiredToken}`);
    authenticate(ctxExpired.req, ctxExpired.res, ctxExpired.next);
    const errExpired = ctxExpired.getError();
    assert.ok(errExpired instanceof AppError);
    assert.strictEqual(errExpired.statusCode, HttpStatusCode.UNAUTHORIZED);
    assert.strictEqual(errExpired.errorCode, ApiErrorCode.TOKEN_EXPIRED);
    console.log('     ✓ Expired token rejected with 401 TOKEN_EXPIRED');

    // 2b: Wrong secret signature
    const fakeToken = jwt.sign(
      { id: userId, email: testEmail, role: 'STUDENT' },
      'unauthorized_fake_secret_key_1234567890',
      { expiresIn: '15m' },
    );
    const ctxFake = createMockExpressContext(`Bearer ${fakeToken}`);
    authenticate(ctxFake.req, ctxFake.res, ctxFake.next);
    const errFake = ctxFake.getError();
    assert.ok(errFake instanceof AppError);
    assert.strictEqual(errFake.statusCode, HttpStatusCode.UNAUTHORIZED);
    console.log('     ✓ Wrong secret token rejected with 401 UNAUTHORIZED');
  }

  // Test Case 3: Authenticated Logout & Database Invalidation
  {
    console.log('  3. Testing authenticated logout end-to-end...');
    const ctx = createMockExpressContext(`Bearer ${validAccessToken}`, {
      refreshToken: validRefreshToken,
    });

    // Run middleware
    authenticate(ctx.req, ctx.res, ctx.next);
    assert.strictEqual(ctx.getError(), null, 'Middleware should accept valid token');
    assert.ok(ctx.req.user, 'req.user should be populated');

    // Run controller
    await AuthController.logout(ctx.req, ctx.res, ctx.next);

    assert.strictEqual(ctx.getError(), null, 'Logout controller should not produce errors');
    assert.strictEqual(ctx.getStatusCode(), 200, 'Logout should return HTTP 200');

    const response = ctx.getResponse();
    assert.strictEqual(response.success, true, 'Response success should be true');
    assert.strictEqual(response.message, 'Logged out successfully.');
    assert.strictEqual(response.data, null, 'Response data should be null');

    // Security check: Verify no tokens or sensitive information is leaked in response
    const jsonString = JSON.stringify(response);
    assert.ok(!jsonString.includes(validAccessToken), 'Access token must not be leaked');
    assert.ok(!jsonString.includes(validRefreshToken), 'Refresh token must not be leaked');
    console.log(
      '     ✓ Authenticated logout succeeded with clean 200 response and zero token leaks',
    );

    // Verify Refresh Token invalidation in Database
    const refreshTokensAfter = await prisma.refreshToken.findMany({
      where: { userId },
    });
    for (const rt of refreshTokensAfter) {
      assert.strictEqual(rt.revoked, true, 'All refresh tokens for user must be marked revoked');
    }
    console.log('     ✓ Refresh tokens successfully revoked in database');

    // Verify User Sessions termination in Database
    const sessionsAfter = await prisma.userSession.count({ where: { userId } });
    assert.strictEqual(sessionsAfter, 0, 'Active user sessions must be completely removed from DB');
    console.log('     ✓ User sessions successfully cleared from database');
  }

  // Test Case 4: Repeated / Idempotent Logout Behavior
  {
    console.log('  4. Testing repeated logout idempotency...');
    const ctxRepeated = createMockExpressContext(`Bearer ${validAccessToken}`, {
      refreshToken: validRefreshToken,
    });

    authenticate(ctxRepeated.req, ctxRepeated.res, ctxRepeated.next);
    await AuthController.logout(ctxRepeated.req, ctxRepeated.res, ctxRepeated.next);

    assert.strictEqual(ctxRepeated.getError(), null);
    assert.strictEqual(ctxRepeated.getStatusCode(), 200);
    assert.strictEqual(ctxRepeated.getResponse().success, true);
    console.log('     ✓ Repeated logout executes cleanly and idempotently with HTTP 200');
  }

  console.log('🎉 All Backend Logout Authentication Tests Passed Successfully!');
}

testAuthLogout()
  .catch((err) => {
    console.error('❌ Backend Logout Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
