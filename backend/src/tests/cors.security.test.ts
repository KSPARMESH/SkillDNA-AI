import assert from 'node:assert';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../app';
import { getAllowedOrigins, isOriginAllowed, DEFAULT_ALLOWED_ORIGINS } from '../config/cors.config';

async function runCorsSecurityTests() {
  console.log('🧪 Running Comprehensive CORS Security Hardening Tests...\n');

  // ---------------------------------------------------------------------------
  // 1. Unit Tests: Allowed Origin Resolution & Whitelist Verification
  // ---------------------------------------------------------------------------
  console.log('  1. Testing allowed origins resolution & default whitelist...');
  const origins = getAllowedOrigins();
  assert.ok(
    origins.includes('https://skill-dna-ai-frontend.vercel.app'),
    'Production Vercel frontend must be in allowed origins whitelist',
  );
  assert.ok(
    origins.includes('http://localhost:3000'),
    'Development localhost:3000 must be in allowed origins whitelist',
  );
  assert.ok(
    origins.includes('http://127.0.0.1:3000'),
    'Development 127.0.0.1:3000 must be in allowed origins whitelist',
  );
  console.log('     ✓ Production and development origins verified in whitelist');

  // ---------------------------------------------------------------------------
  // 2. Unit Tests: isOriginAllowed Validation Logic
  // ---------------------------------------------------------------------------
  console.log('  2. Testing isOriginAllowed validation helper...');
  assert.strictEqual(
    isOriginAllowed('https://skill-dna-ai-frontend.vercel.app'),
    true,
    'Production frontend origin must be permitted',
  );
  assert.strictEqual(
    isOriginAllowed('https://skill-dna-ai-frontend.vercel.app/'),
    true,
    'Production frontend origin with trailing slash must be normalized and permitted',
  );
  assert.strictEqual(
    isOriginAllowed('http://localhost:3000'),
    true,
    'Localhost origin must be permitted',
  );
  assert.strictEqual(
    isOriginAllowed('https://malicious-attacker.com'),
    false,
    'Unauthorized external origin must be rejected',
  );
  assert.strictEqual(
    isOriginAllowed('http://evil.com'),
    false,
    'Arbitrary evil.com origin must be rejected',
  );
  assert.strictEqual(
    isOriginAllowed(undefined),
    true,
    'Direct server-to-server / curl requests with no Origin header must be allowed through',
  );
  console.log(
    '     ✓ isOriginAllowed helper enforces strict whitelist with safe non-browser fallbacks',
  );

  // ---------------------------------------------------------------------------
  // 3. Live HTTP Server Tests
  // ---------------------------------------------------------------------------
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // -------------------------------------------------------------------------
    // 3a. Production Allowed Origin (GET /health)
    // -------------------------------------------------------------------------
    console.log(
      '  3. Testing HTTP request from Production Origin (https://skill-dna-ai-frontend.vercel.app)...',
    );
    const prodRes = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        Origin: 'https://skill-dna-ai-frontend.vercel.app',
      },
    });
    assert.strictEqual(prodRes.status, 200, 'Health endpoint must respond 200');
    assert.strictEqual(
      prodRes.headers.get('access-control-allow-origin'),
      'https://skill-dna-ai-frontend.vercel.app',
      'Must return Access-Control-Allow-Origin matching production frontend',
    );
    assert.strictEqual(
      prodRes.headers.get('access-control-allow-credentials'),
      'true',
      'Must set Access-Control-Allow-Credentials: true',
    );
    console.log('     ✓ Production origin granted CORS access with credentials');

    // -------------------------------------------------------------------------
    // 3b. Development Allowed Origin (GET /health)
    // -------------------------------------------------------------------------
    console.log('  4. Testing HTTP request from Development Origin (http://localhost:3000)...');
    const devRes = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        Origin: 'http://localhost:3000',
      },
    });
    assert.strictEqual(devRes.status, 200);
    assert.strictEqual(
      devRes.headers.get('access-control-allow-origin'),
      'http://localhost:3000',
      'Must return Access-Control-Allow-Origin matching localhost:3000',
    );
    assert.strictEqual(devRes.headers.get('access-control-allow-credentials'), 'true');
    console.log('     ✓ Development origin (localhost:3000) granted CORS access');

    // -------------------------------------------------------------------------
    // 3c. Unauthorized Origin Rejected (GET /health)
    // -------------------------------------------------------------------------
    console.log(
      '  5. Testing HTTP request from Unauthorized Origin (https://evil-site.attacker.com)...',
    );
    const unauthRes = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        Origin: 'https://evil-site.attacker.com',
      },
    });
    assert.strictEqual(unauthRes.status, 200);
    assert.strictEqual(
      unauthRes.headers.get('access-control-allow-origin'),
      null,
      'Must NOT return Access-Control-Allow-Origin for unauthorized origin',
    );
    console.log('     ✓ Unauthorized origin successfully denied CORS headers');

    // -------------------------------------------------------------------------
    // 3d. Preflight OPTIONS Behavior for Allowed Origin
    // -------------------------------------------------------------------------
    console.log('  6. Testing OPTIONS Preflight request from Production Allowed Origin...');
    const preflightAllowedRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://skill-dna-ai-frontend.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization, Content-Type',
      },
    });
    assert.strictEqual(
      preflightAllowedRes.status,
      204,
      'Preflight OPTIONS request must return HTTP 204 No Content',
    );
    assert.strictEqual(
      preflightAllowedRes.headers.get('access-control-allow-origin'),
      'https://skill-dna-ai-frontend.vercel.app',
      'Preflight must include Access-Control-Allow-Origin',
    );
    assert.strictEqual(preflightAllowedRes.headers.get('access-control-allow-credentials'), 'true');
    const allowMethods = preflightAllowedRes.headers.get('access-control-allow-methods') || '';
    assert.ok(
      allowMethods.includes('POST') && allowMethods.includes('GET'),
      'Preflight must allow standard HTTP methods',
    );
    const allowHeaders = preflightAllowedRes.headers.get('access-control-allow-headers') || '';
    assert.ok(
      allowHeaders.toLowerCase().includes('authorization'),
      'Preflight must allow Authorization header',
    );
    assert.ok(
      allowHeaders.toLowerCase().includes('content-type'),
      'Preflight must allow Content-Type header',
    );
    console.log(
      '     ✓ Preflight OPTIONS request successfully processed with HTTP 204 and full CORS headers',
    );

    // -------------------------------------------------------------------------
    // 3e. Preflight OPTIONS Behavior for Unauthorized Origin
    // -------------------------------------------------------------------------
    console.log('  7. Testing OPTIONS Preflight request from Unauthorized Origin...');
    const preflightRejectedRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://unauthorized-origin.com',
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert.strictEqual(
      preflightRejectedRes.headers.get('access-control-allow-origin'),
      null,
      'Preflight must NOT include Access-Control-Allow-Origin for unauthorized origin',
    );
    console.log('     ✓ Unauthorized preflight correctly denied CORS headers');

    // -------------------------------------------------------------------------
    // 3f. Authorization Header Handling
    // -------------------------------------------------------------------------
    console.log('  8. Testing Authorization header handling with CORS headers...');
    const authCorsRes = await fetch(`${baseUrl}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        Origin: 'https://skill-dna-ai-frontend.vercel.app',
        Authorization: 'Bearer invalid_or_missing_jwt_for_header_test',
      },
    });
    // Regardless of 401 response from auth middleware, CORS header must still be populated for allowed origin
    assert.strictEqual(
      authCorsRes.headers.get('access-control-allow-origin'),
      'https://skill-dna-ai-frontend.vercel.app',
      'CORS headers must be preserved even on error / 401 responses for allowed origins',
    );
    console.log('     ✓ Authorization header handling and error CORS preservation verified');

    console.log('\n🎉 ALL 8 CORS Security & Whitelist Tests Passed Successfully!');
  } finally {
    server.close();
  }
}

runCorsSecurityTests().catch((err) => {
  console.error('❌ CORS Security Tests Failed:', err);
  process.exit(1);
});
