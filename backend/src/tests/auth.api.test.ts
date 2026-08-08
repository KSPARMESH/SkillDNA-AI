import { AuthService } from '../domains/auth/auth.service';

async function testAuthService() {
  console.log('🧪 Running Backend AuthService Integration Test...');
  const result = await AuthService.login({ email: 'student@skilldna.ai', password: 'password123' });
  console.assert(result.user.email === 'student@skilldna.ai', 'Auth login failed email match');
  console.assert(!!result.accessToken, 'Missing accessToken on login response');
  console.log('✅ Backend AuthService Integration Test Passed.');
}

testAuthService();
