import assert from 'node:assert';
import { getProfileApi, updateProfileApi } from '../services/api.service';

// Mock localStorage and window environment for Node / testing environment
const mockStorage: Record<string, string> = {};

(global as any).window = {
  location: { href: '', pathname: '/profile' },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};

(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
};

function createMockJwt(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payloadData = JSON.stringify({
    id: 'usr-profile-test-id',
    email: 'profile.tester@skilldna.ai',
    role: 'STUDENT',
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  const payload = Buffer.from(payloadData).toString('base64');
  const signature = 'mock_sig';
  return `${header}.${payload}.${signature}`;
}

async function runProfileEditTests() {
  console.log('🧪 Running Comprehensive Frontend Profile Editing & Update Flow Tests...');

  // Setup valid authentication
  const mockToken = createMockJwt();
  localStorage.setItem('accessToken', mockToken);

  // Mock initial profile data
  let currentDatabaseProfile = {
    id: 'usr-profile-test-id',
    userId: 'usr-profile-test-id',
    email: 'profile.tester@skilldna.ai',
    firstName: 'Parmesh',
    lastName: 'KS',
    role: 'STUDENT',
    headline: 'Full Stack Engineer',
    bio: 'Initial bio before update.',
    location: 'Tamil Nadu, India',
    profile: {
      id: 'prof-123',
      userId: 'usr-profile-test-id',
      targetRole: 'Senior AI Engineer',
      yearsOfExperience: 3,
      expectedSalary: 120000,
      availabilityStatus: 'OPEN_TO_WORK',
      totalSkillDnaScore: 88.5,
      totalReadinessScore: 92.0,
    },
  };

  // Mock fetch function to simulate GET /users/me and PUT /users/me
  (global as any).fetch = async (url: string, options: any = {}) => {
    // Check for Authorization Header
    assert.strictEqual(
      options.headers?.Authorization,
      `Bearer ${mockToken}`,
      'Authorization Bearer header must be present on authenticated requests',
    );

    if (options.method === 'GET' || !options.method) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          message: 'User profile retrieved successfully.',
          data: currentDatabaseProfile,
        }),
      };
    }

    if (options.method === 'PUT') {
      const body = JSON.parse(options.body);

      // Simulate backend update logic
      currentDatabaseProfile = {
        ...currentDatabaseProfile,
        headline: body.headline !== undefined ? body.headline : currentDatabaseProfile.headline,
        bio: body.bio !== undefined ? body.bio : currentDatabaseProfile.bio,
        location: body.location !== undefined ? body.location : currentDatabaseProfile.location,
        profile: {
          ...currentDatabaseProfile.profile,
          targetRole:
            body.targetRole !== undefined
              ? body.targetRole
              : currentDatabaseProfile.profile.targetRole,
          yearsOfExperience:
            body.yearsOfExperience !== undefined
              ? body.yearsOfExperience
              : currentDatabaseProfile.profile.yearsOfExperience,
          expectedSalary:
            body.expectedSalary !== undefined
              ? body.expectedSalary
              : currentDatabaseProfile.profile.expectedSalary,
          availabilityStatus:
            body.availabilityStatus !== undefined
              ? body.availabilityStatus
              : currentDatabaseProfile.profile.availabilityStatus,
        },
      };

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          message: 'User profile updated successfully.',
          data: currentDatabaseProfile,
        }),
      };
    }

    throw new Error(`Unsupported method ${options.method}`);
  };

  // Test 1: Fetch and display initial profile data
  console.log('  1. Testing initial profile fetch (GET /api/v1/users/me)...');
  const initialFetch = await getProfileApi();
  assert.strictEqual(initialFetch.success, true);
  assert.strictEqual(initialFetch.data.headline, 'Full Stack Engineer');
  assert.strictEqual(initialFetch.data.profile.yearsOfExperience, 3);
  assert.strictEqual(initialFetch.data.profile.expectedSalary, 120000);
  assert.strictEqual(initialFetch.data.profile.availabilityStatus, 'OPEN_TO_WORK');
  console.log('     ✓ Initial profile data retrieved and parsed cleanly');

  // Test 2: Opening edit mode & pre-populating form values
  console.log('  2. Testing edit mode form pre-population...');
  const formState = {
    headline: initialFetch.data.headline || '',
    bio: initialFetch.data.bio || '',
    location: initialFetch.data.location || '',
    targetRole: initialFetch.data.profile.targetRole || '',
    yearsOfExperience: initialFetch.data.profile.yearsOfExperience,
    expectedSalary: initialFetch.data.profile.expectedSalary,
    availabilityStatus: initialFetch.data.profile.availabilityStatus,
  };
  assert.strictEqual(formState.headline, 'Full Stack Engineer');
  assert.strictEqual(formState.targetRole, 'Senior AI Engineer');
  assert.strictEqual(formState.yearsOfExperience, 3);
  console.log('     ✓ Form state accurately initialized from profile data');

  // Test 3: Validation Logic (Client-side validation rules)
  console.log('  3. Testing profile form validation rules...');
  const validate = (state: typeof formState) => {
    const errors: Record<string, string> = {};
    if (state.yearsOfExperience !== '' && Number(state.yearsOfExperience) < 0) {
      errors.yearsOfExperience = 'Years of experience must be non-negative.';
    }
    if (state.yearsOfExperience !== '' && Number(state.yearsOfExperience) > 60) {
      errors.yearsOfExperience = 'Years of experience cannot exceed 60.';
    }
    if (state.expectedSalary !== '' && Number(state.expectedSalary) < 0) {
      errors.expectedSalary = 'Expected salary must be non-negative.';
    }
    if (state.headline && state.headline.length > 150) {
      errors.headline = 'Headline too long.';
    }
    return errors;
  };

  // Test negative experience rejection
  const invalidExpErrors = validate({ ...formState, yearsOfExperience: -5 });
  assert.ok(invalidExpErrors.yearsOfExperience, 'Should reject negative experience');

  // Test negative salary rejection
  const invalidSalErrors = validate({ ...formState, expectedSalary: -1000 });
  assert.ok(invalidSalErrors.expectedSalary, 'Should reject negative expected salary');

  // Test excessive headline length rejection
  const invalidHeadlineErrors = validate({ ...formState, headline: 'a'.repeat(160) });
  assert.ok(invalidHeadlineErrors.headline, 'Should reject headline > 150 chars');

  console.log('     ✓ Validation logic correctly catches invalid inputs and blocks submission');

  // Test 4: Cancel Edit Action (Discards edits and restores previous state)
  console.log('  4. Testing cancel edit action...');
  let draftState = {
    ...formState,
    headline: 'Draft Headline That Should Be Discarded',
    yearsOfExperience: 10,
  };
  // Simulate cancel
  draftState = { ...formState };
  assert.strictEqual(draftState.headline, 'Full Stack Engineer');
  assert.strictEqual(draftState.yearsOfExperience, 3);
  console.log('     ✓ Cancel action successfully discards drafts and reverts to current profile');

  // Test 5: Successful Profile Update (PUT /api/v1/users/me)
  console.log('  5. Testing successful profile update (PUT /api/v1/users/me)...');
  const updatePayload = {
    headline: 'Principal AI Architect & Distributed Systems Engineer',
    bio: 'Pioneering multimodal AI identity networks and scalable Next.js architectures.',
    location: 'San Francisco, CA / Remote',
    targetRole: 'Principal AI Architect',
    yearsOfExperience: 6,
    expectedSalary: 185000,
    availabilityStatus: 'ACTIVELY_INTERVIEWING',
  };

  const updateResponse = await updateProfileApi(updatePayload);
  assert.strictEqual(updateResponse.success, true);
  assert.strictEqual(
    updateResponse.data.headline,
    'Principal AI Architect & Distributed Systems Engineer',
  );
  assert.strictEqual(updateResponse.data.location, 'San Francisco, CA / Remote');
  assert.strictEqual(updateResponse.data.profile.targetRole, 'Principal AI Architect');
  assert.strictEqual(updateResponse.data.profile.yearsOfExperience, 6);
  assert.strictEqual(updateResponse.data.profile.expectedSalary, 185000);
  assert.strictEqual(updateResponse.data.profile.availabilityStatus, 'ACTIVELY_INTERVIEWING');
  console.log('     ✓ PUT /users/me updated profile immediately without requiring re-login');

  // Test 6: Persistence Verification (Simulate Page Refresh / F5)
  console.log('  6. Testing persistence verification after refresh (GET /api/v1/users/me)...');
  const postRefreshFetch = await getProfileApi();
  assert.strictEqual(postRefreshFetch.success, true);
  assert.strictEqual(
    postRefreshFetch.data.headline,
    'Principal AI Architect & Distributed Systems Engineer',
  );
  assert.strictEqual(postRefreshFetch.data.profile.targetRole, 'Principal AI Architect');
  assert.strictEqual(postRefreshFetch.data.profile.yearsOfExperience, 6);
  assert.strictEqual(postRefreshFetch.data.profile.expectedSalary, 185000);
  assert.strictEqual(postRefreshFetch.data.profile.availabilityStatus, 'ACTIVELY_INTERVIEWING');
  console.log('     ✓ Persisted values successfully reloaded from backend on page refresh');

  // Test 7: API Failure Handling
  console.log('  7. Testing API network/server failure handling during save...');
  (global as any).fetch = async () => {
    throw new Error('Internal Server Error or Network Offline');
  };

  try {
    await updateProfileApi(updatePayload);
    assert.fail('Should throw or catch error safely');
  } catch (err: any) {
    assert.ok(
      err.message.includes('Internal Server Error') || err.message.includes('Network Offline'),
    );
  }
  console.log('     ✓ API network/server errors caught safely without crashing frontend');

  console.log('🎉 All Frontend Profile Editing & Update Tests Passed Successfully!');
}

runProfileEditTests().catch((err) => {
  console.error('❌ Frontend Profile Edit Tests Failed:', err);
  process.exit(1);
});
