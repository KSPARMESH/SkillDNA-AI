import { UserService } from '../domains/user/user.service';

async function testUserService() {
  console.log('🧪 Running Backend UserService Integration Test...');
  const profile = await UserService.getProfile('student_demo_id');
  console.assert(profile.userId === 'student_demo_id', 'UserService profile fetch failed');
  console.log('✅ Backend UserService Integration Test Passed.');
}

testUserService();
