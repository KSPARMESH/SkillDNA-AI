import assert from 'node:assert';
import { AuthService } from '../domains/auth/auth.service';
import { UserService } from '../domains/user/user.service';
import { AppError, HttpStatusCode } from '@skilldna/shared';

async function testUserService() {
  console.log('🧪 Running Backend UserService Integration Tests...');

  // 1. Register a test user to ensure record exists in DB
  const testEmail = `user.test.${Date.now()}@skilldna.ai`;
  const registerResult = await AuthService.register({
    email: testEmail,
    password: 'Password123!',
    firstName: 'UserDomain',
    lastName: 'Tester',
  });

  const userId = registerResult.user.id;
  assert.ok(userId, 'Registered user should have a valid ID');

  // 2. Fetch User Profile
  console.log('  Testing: UserService.getProfile...');
  const profile = await UserService.getProfile(userId);
  assert.strictEqual(profile.id, userId, 'Profile ID should match registered user ID');
  assert.strictEqual(profile.email, testEmail, 'Email should match registered user email');
  assert.strictEqual(profile.firstName, 'UserDomain', 'First name should match');
  console.log('  ✅ Passed: UserService.getProfile');

  // 3. Update User Profile
  console.log('  Testing: UserService.updateProfile...');
  const updateData = {
    headline: 'Senior Full Stack AI Engineer',
    bio: 'Passionate about AI architectures and monorepos.',
    location: 'San Francisco, CA',
    targetRole: 'Lead AI Engineer',
    yearsOfExperience: 5,
  };

  const updatedProfile = await UserService.updateProfile(userId, updateData);
  assert.strictEqual(
    updatedProfile.headline,
    'Senior Full Stack AI Engineer',
    'Headline should be updated',
  );
  assert.strictEqual(
    updatedProfile.bio,
    'Passionate about AI architectures and monorepos.',
    'Bio should be updated',
  );
  assert.strictEqual(
    updatedProfile.profile?.targetRole,
    'Lead AI Engineer',
    'Target role in profile should be updated',
  );
  assert.strictEqual(
    updatedProfile.profile?.yearsOfExperience,
    5,
    'Years of experience should be updated',
  );
  console.log('  ✅ Passed: UserService.updateProfile');

  // 4. Non-existent User Profile lookup
  console.log('  Testing: non-existent user profile lookup...');
  try {
    await UserService.getProfile('00000000-0000-0000-0000-000000000000');
    assert.fail('Should have thrown AppError for non-existent user');
  } catch (err: any) {
    assert.ok(err instanceof AppError, 'Should throw AppError');
    assert.strictEqual(err.statusCode, HttpStatusCode.NOT_FOUND, 'Should return 404 status code');
  }
  console.log('  ✅ Passed: non-existent user profile lookup');

  console.log('🎉 All Backend UserService Integration Tests Passed Successfully!');
}

testUserService().catch((err) => {
  console.error('❌ UserService Test Failed:', err);
  process.exit(1);
});
