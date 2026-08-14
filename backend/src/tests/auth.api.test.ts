import assert from 'node:assert';
import { AuthService } from '../domains/auth/auth.service';
import { prisma } from '@skilldna/database';

async function testAuthService() {
  console.log('🧪 Running Backend AuthService Integration Test...');
  const result = await AuthService.login({ email: 'student@skilldna.ai', password: 'password123' });
  assert.strictEqual(result.user.email, 'student@skilldna.ai', 'Auth login failed email match');
  assert.ok(result.accessToken, 'Missing accessToken on login response');
  assert.ok(result.refreshToken, 'Missing refreshToken on login response');
  console.log('  ✓ AuthService.login succeeded');

  const logoutResult = await AuthService.logout(result.user.id, result.refreshToken);
  assert.strictEqual(logoutResult.success, true, 'AuthService.logout failed');
  console.log('  ✓ AuthService.logout succeeded');

  console.log('✅ Backend AuthService Integration Test Passed.');
}

testAuthService()
  .catch((err) => {
    console.error('❌ AuthService Integration Test Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
