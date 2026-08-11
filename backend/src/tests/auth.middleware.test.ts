import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import assert from 'node:assert';
import { authenticate } from '../middleware/auth.middleware';
import { config } from '../config';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

function createMockContext(authorizationHeader?: string) {
  const req = {
    headers: {
      ...(authorizationHeader ? { authorization: authorizationHeader } : {}),
    },
  } as Request;

  const res = {} as Response;

  let errorPassedToNext: any = null;
  let nextCalledWithoutError = false;

  const next: NextFunction = (err?: any) => {
    if (err) {
      errorPassedToNext = err;
    } else {
      nextCalledWithoutError = true;
    }
  };

  return {
    req,
    res,
    next,
    getError: () => errorPassedToNext,
    wasSuccessful: () => nextCalledWithoutError,
  };
}

async function testAuthMiddleware() {
  console.log('🧪 Running Auth Middleware Tests...');

  // Test Case 1: Missing Authorization Header
  {
    console.log('  Testing: missing Authorization header...');
    const ctx = createMockContext(undefined);
    authenticate(ctx.req, ctx.res, ctx.next);

    const err = ctx.getError();
    assert.ok(err instanceof AppError, 'Should pass AppError to next()');
    assert.strictEqual(
      err.statusCode,
      HttpStatusCode.UNAUTHORIZED,
      'Should return 401 status code',
    );
    assert.strictEqual(
      err.errorCode,
      ApiErrorCode.AUTHENTICATION_FAILED,
      'Should return AUTHENTICATION_FAILED error code',
    );
    assert.strictEqual(ctx.req.user, undefined, 'req.user should be undefined');
    console.log('  ✅ Passed: missing Authorization header test');
  }

  // Test Case 2: Malformed Authorization Headers
  {
    console.log('  Testing: malformed Authorization headers...');
    const malformedHeaders = [
      'Basic dXNlcjpwYXNz',
      'Bearer',
      'Bearer   ',
      'Bearer token1 token2',
      'CustomToken 12345',
    ];

    for (const header of malformedHeaders) {
      const ctx = createMockContext(header);
      authenticate(ctx.req, ctx.res, ctx.next);

      const err = ctx.getError();
      assert.ok(err instanceof AppError, `Header "${header}" should yield AppError`);
      assert.strictEqual(
        err.statusCode,
        HttpStatusCode.UNAUTHORIZED,
        `Header "${header}" should return 401`,
      );
      assert.strictEqual(ctx.req.user, undefined, `Header "${header}" should not attach user`);
    }
    console.log('  ✅ Passed: malformed Authorization header tests');
  }

  // Test Case 3: Invalid JWT (corrupted token or wrong secret)
  {
    console.log('  Testing: invalid JWT...');

    // 3a. Completely invalid JWT string
    {
      const ctx = createMockContext('Bearer invalid.jwt.string');
      authenticate(ctx.req, ctx.res, ctx.next);

      const err = ctx.getError();
      assert.ok(err instanceof AppError, 'Invalid JWT string should yield AppError');
      assert.strictEqual(
        err.statusCode,
        HttpStatusCode.UNAUTHORIZED,
        'Invalid JWT should return 401',
      );
      assert.strictEqual(
        err.errorCode,
        ApiErrorCode.AUTHENTICATION_FAILED,
        'Invalid JWT should return AUTHENTICATION_FAILED',
      );
    }

    // 3b. Token signed with wrong secret key
    {
      const wrongSecretToken = jwt.sign(
        { id: 'user-999', email: 'hacker@skilldna.ai', role: 'STUDENT' },
        'wrong_secret_key_12345678901234567890',
        { expiresIn: '15m' },
      );
      const ctx = createMockContext(`Bearer ${wrongSecretToken}`);
      authenticate(ctx.req, ctx.res, ctx.next);

      const err = ctx.getError();
      assert.ok(err instanceof AppError, 'Wrong secret token should yield AppError');
      assert.strictEqual(
        err.statusCode,
        HttpStatusCode.UNAUTHORIZED,
        'Wrong secret token should return 401',
      );
      assert.strictEqual(
        err.errorCode,
        ApiErrorCode.AUTHENTICATION_FAILED,
        'Wrong secret token should return AUTHENTICATION_FAILED',
      );
    }
    console.log('  ✅ Passed: invalid JWT tests');
  }

  // Test Case 4: Valid JWT
  {
    console.log('  Testing: valid JWT...');
    const validToken = jwt.sign(
      { id: 'usr-12345', email: 'student@skilldna.ai', role: 'STUDENT' },
      config.jwtSecret,
      { expiresIn: '15m' },
    );

    const ctx = createMockContext(`Bearer ${validToken}`);
    authenticate(ctx.req, ctx.res, ctx.next);

    assert.strictEqual(ctx.getError(), null, 'Valid JWT should not pass error to next()');
    assert.strictEqual(ctx.wasSuccessful(), true, 'Valid JWT should call next() successfully');
    assert.deepStrictEqual(
      ctx.req.user,
      { id: 'usr-12345', email: 'student@skilldna.ai', role: 'STUDENT' },
      'Valid JWT should attach correct user payload to req.user',
    );
    console.log('  ✅ Passed: valid JWT test');
  }

  // Test Case 5: Expired JWT
  {
    console.log('  Testing: expired JWT...');
    const expiredToken = jwt.sign(
      { id: 'usr-12345', email: 'student@skilldna.ai', role: 'STUDENT' },
      config.jwtSecret,
      { expiresIn: '-10s' },
    );

    const ctx = createMockContext(`Bearer ${expiredToken}`);
    authenticate(ctx.req, ctx.res, ctx.next);

    const err = ctx.getError();
    assert.ok(err instanceof AppError, 'Expired JWT should yield AppError');
    assert.strictEqual(
      err.statusCode,
      HttpStatusCode.UNAUTHORIZED,
      'Expired JWT should return 401',
    );
    assert.strictEqual(
      err.errorCode,
      ApiErrorCode.TOKEN_EXPIRED,
      'Expired JWT should return TOKEN_EXPIRED',
    );
    assert.strictEqual(ctx.req.user, undefined, 'Expired JWT should not attach user');
    console.log('  ✅ Passed: expired JWT test');
  }

  console.log('🎉 All Auth Middleware Tests Passed Successfully!');
}

testAuthMiddleware().catch((err) => {
  console.error('❌ Auth Middleware Test Failed:', err);
  process.exit(1);
});
