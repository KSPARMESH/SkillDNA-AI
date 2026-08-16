import assert from 'node:assert';
import http from 'node:http';
import express, { Request, Response } from 'express';
import { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { app } from '../app';
import { config } from '../config';
import {
  createRateLimiter,
  generalRateLimiter,
  authLoginRateLimiter,
  authRefreshRateLimiter,
  aiReportRateLimiter,
} from '../middleware/rate-limiter.middleware';
import { HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

function createMockJwtToken(userId = 'usr-ratelimit-001', role = 'STUDENT'): string {
  return jwt.sign({ id: userId, email: 'rate.limit.test@skilldna.ai', role }, config.jwtSecret, {
    expiresIn: '15m',
  });
}

async function runRateLimiterSecurityTests() {
  console.log('🧪 Running Comprehensive Express Rate Limiting Security Tests...\n');

  // ---------------------------------------------------------------------------
  // 1. Unit & Factory Tests: Isolated Express App with Configurable Limits
  // ---------------------------------------------------------------------------
  console.log('  1. Testing createRateLimiter factory and 429 standard JSON response...');
  {
    const testApp = express();
    testApp.set('trust proxy', 1);

    const testLimiter = createRateLimiter({
      windowMs: 5000,
      max: 2,
      message: 'Custom rate limit message for test.',
    });

    testApp.get('/test-limit', testLimiter, (req: Request, res: Response) => {
      res.status(200).json({ success: true, count: 'ok' });
    });

    const testServer = http.createServer(testApp);
    await new Promise<void>((resolve) => testServer.listen(0, '127.0.0.1', () => resolve()));
    const port = (testServer.address() as AddressInfo).port;
    const testUrl = `http://127.0.0.1:${port}/test-limit`;

    try {
      // Request 1: Allowed (below limit)
      const res1 = await fetch(testUrl);
      assert.strictEqual(res1.status, 200, '1st request must succeed with 200');
      const body1 = await res1.json();
      assert.strictEqual(body1.success, true);
      assert.ok(res1.headers.get('ratelimit-limit'), 'Draft-7 ratelimit-limit header should exist');
      assert.strictEqual(
        res1.headers.get('ratelimit-remaining'),
        '1',
        'Remaining requests should be 1',
      );

      // Request 2: Allowed (at limit)
      const res2 = await fetch(testUrl);
      assert.strictEqual(res2.status, 200, '2nd request must succeed with 200');
      assert.strictEqual(
        res2.headers.get('ratelimit-remaining'),
        '0',
        'Remaining requests should be 0',
      );

      // Request 3: Exceeded (HTTP 429)
      const res3 = await fetch(testUrl);
      assert.strictEqual(res3.status, 429, '3rd request exceeding limit must return HTTP 429');
      const body3 = await res3.json();

      // Verify standard API error structure
      assert.strictEqual(body3.success, false, '429 body must have success: false');
      assert.strictEqual(body3.statusCode, HttpStatusCode.TOO_MANY_REQUESTS);
      assert.strictEqual(body3.errorCode, ApiErrorCode.RATE_LIMIT_EXCEEDED);
      assert.strictEqual(body3.message, 'Custom rate limit message for test.');
      assert.ok(body3.timestamp, '429 body must include ISO timestamp');
      assert.strictEqual(body3.stack, undefined, 'Internal stack trace must NOT be exposed');

      // Request from a different IP (X-Forwarded-For) must have its own isolated quota
      const resDiffIp = await fetch(testUrl, {
        headers: {
          'X-Forwarded-For': '198.51.100.42',
        },
      });
      assert.strictEqual(
        resDiffIp.status,
        200,
        'Different IP via X-Forwarded-For must have independent quota',
      );

      console.log(
        '     ✓ Rate limiter factory correctly returns HTTP 429 and standard error response',
      );
    } finally {
      testServer.close();
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Full App Endpoints Verification
  // ---------------------------------------------------------------------------
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const appPort = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${appPort}`;

  try {
    // -------------------------------------------------------------------------
    // 2a. Login Endpoint Protection (POST /api/v1/auth/login)
    // -------------------------------------------------------------------------
    console.log('  2. Testing Login Endpoint rate limiter (POST /api/v1/auth/login)...');
    const loginIp = '203.0.113.10';

    // Send requests up to configured limit
    const loginLimit = config.rateLimit.authLoginMaxRequests;
    console.log(`     Simulating ${loginLimit} login attempts for IP ${loginIp}...`);

    for (let i = 1; i <= loginLimit; i++) {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': loginIp,
          Origin: 'https://skill-dna-ai-frontend.vercel.app',
        },
        body: JSON.stringify({
          email: 'nonexistent@skilldna.ai',
          password: 'wrongpassword',
        }),
      });
      // Requests below/at limit are evaluated by auth controller (401 or similar, not 429)
      assert.notStrictEqual(
        res.status,
        429,
        `Login attempt ${i}/${loginLimit} should not be rate-limited prematurely`,
      );
    }

    // Exceeded request -> MUST return 429
    const exceededLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': loginIp,
        Origin: 'https://skill-dna-ai-frontend.vercel.app',
      },
      body: JSON.stringify({
        email: 'attacker@skilldna.ai',
        password: 'attackpassword',
      }),
    });

    assert.strictEqual(
      exceededLoginRes.status,
      429,
      'Login request exceeding limit must return HTTP 429',
    );
    const loginErrBody = await exceededLoginRes.json();
    assert.strictEqual(loginErrBody.success, false);
    assert.strictEqual(loginErrBody.errorCode, ApiErrorCode.RATE_LIMIT_EXCEEDED);
    assert.strictEqual(loginErrBody.statusCode, 429);
    assert.ok(
      loginErrBody.message.includes('login') || loginErrBody.message.includes('rate'),
      'Message should describe login rate limit',
    );
    console.log('     ✓ Login brute-force rate limiter successfully enforced with HTTP 429');

    // -------------------------------------------------------------------------
    // 2b. Refresh Endpoint Protection (POST /api/v1/auth/refresh)
    // -------------------------------------------------------------------------
    console.log('  3. Testing Refresh Endpoint rate limiter (POST /api/v1/auth/refresh)...');
    const refreshIp = '203.0.113.20';
    const refreshLimit = config.rateLimit.authRefreshMaxRequests;
    console.log(`     Simulating ${refreshLimit} refresh attempts for IP ${refreshIp}...`);

    for (let i = 1; i <= refreshLimit; i++) {
      const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': refreshIp,
          Origin: 'https://skill-dna-ai-frontend.vercel.app',
        },
        body: JSON.stringify({
          refreshToken: 'invalid_dummy_refresh_token',
        }),
      });
      assert.notStrictEqual(
        res.status,
        429,
        `Refresh attempt ${i}/${refreshLimit} should not be rate-limited prematurely`,
      );
    }

    // Exceeded refresh request -> MUST return 429
    const exceededRefreshRes = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': refreshIp,
        Origin: 'https://skill-dna-ai-frontend.vercel.app',
      },
      body: JSON.stringify({
        refreshToken: 'invalid_dummy_refresh_token',
      }),
    });

    assert.strictEqual(
      exceededRefreshRes.status,
      429,
      'Refresh request exceeding limit must return HTTP 429',
    );
    const refreshErrBody = await exceededRefreshRes.json();
    assert.strictEqual(refreshErrBody.success, false);
    assert.strictEqual(refreshErrBody.errorCode, ApiErrorCode.RATE_LIMIT_EXCEEDED);
    assert.strictEqual(refreshErrBody.statusCode, 429);
    console.log('     ✓ Refresh token abuse rate limiter successfully enforced with HTTP 429');

    // -------------------------------------------------------------------------
    // 2c. AI Report Generation Protection (POST /api/v1/ai/skill-dna-report)
    // -------------------------------------------------------------------------
    console.log(
      '  4. Testing AI Report Generation rate limiter (POST /api/v1/ai/skill-dna-report)...',
    );
    const aiIp = '203.0.113.30';
    const aiLimit = config.rateLimit.aiReportMaxRequests;
    const testJwt = createMockJwtToken();

    console.log(`     Simulating ${aiLimit} AI report generation requests for IP ${aiIp}...`);

    for (let i = 1; i <= aiLimit; i++) {
      const res = await fetch(`${baseUrl}/api/v1/ai/skill-dna-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testJwt}`,
          'X-Forwarded-For': aiIp,
          Origin: 'https://skill-dna-ai-frontend.vercel.app',
        },
        body: JSON.stringify({}),
      });
      assert.notStrictEqual(
        res.status,
        429,
        `AI report attempt ${i}/${aiLimit} should not be rate-limited prematurely`,
      );
    }

    // Exceeded AI report request -> MUST return 429
    const exceededAiRes = await fetch(`${baseUrl}/api/v1/ai/skill-dna-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testJwt}`,
        'X-Forwarded-For': aiIp,
        Origin: 'https://skill-dna-ai-frontend.vercel.app',
      },
      body: JSON.stringify({}),
    });

    assert.strictEqual(
      exceededAiRes.status,
      429,
      'AI report request exceeding limit must return HTTP 429',
    );
    const aiErrBody = await exceededAiRes.json();
    assert.strictEqual(aiErrBody.success, false);
    assert.strictEqual(aiErrBody.errorCode, ApiErrorCode.RATE_LIMIT_EXCEEDED);
    assert.strictEqual(aiErrBody.statusCode, 429);
    assert.ok(
      aiErrBody.message.includes('AI SkillDNA report generation limit reached') ||
        aiErrBody.message.includes('rate'),
    );
    console.log('     ✓ AI report generation rate limiter successfully enforced with HTTP 429');

    // -------------------------------------------------------------------------
    // 2d. Health Route Unmetered Verification
    // -------------------------------------------------------------------------
    console.log('  5. Testing that /health endpoint is NOT throttled by rate limits...');
    for (let i = 0; i < 20; i++) {
      const healthRes = await fetch(`${baseUrl}/health`, {
        headers: { 'X-Forwarded-For': loginIp },
      });
      assert.strictEqual(
        healthRes.status,
        200,
        'Health check must remain 200 even after login rate limit exhaustion',
      );
    }
    console.log('     ✓ /health endpoint remains unmetered for uptime monitoring');

    console.log('\n🎉 ALL Express Rate Limiting Security Tests Passed Successfully!');
  } finally {
    server.close();
  }
}

runRateLimiterSecurityTests().catch((err) => {
  console.error('❌ Express Rate Limiter Tests Failed:', err);
  process.exit(1);
});
