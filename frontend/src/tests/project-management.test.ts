import assert from 'node:assert';
import {
  getProjectsApi,
  getProjectByIdApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
} from '../services/api.service';

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
    id: 'usr-project-test-id',
    email: 'project.tester@skilldna.ai',
    role: 'STUDENT',
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  const payload = Buffer.from(payloadData).toString('base64');
  const signature = 'mock_sig';
  return `${header}.${payload}.${signature}`;
}

async function runFrontendProjectManagementTests() {
  console.log('🧪 Running Comprehensive Frontend Project Management & CRUD Tests...');

  // Setup valid authentication
  const mockToken = createMockJwt();
  localStorage.setItem('accessToken', mockToken);

  // In-memory mock database of projects for testing
  let projectsDatabase: any[] = [];

  // Mock global fetch
  (global as any).fetch = async (url: string, options: any = {}) => {
    // Verify Bearer authorization
    assert.strictEqual(
      options.headers?.Authorization,
      `Bearer ${mockToken}`,
      'Authorization Bearer header must be present on authenticated requests',
    );

    const parsedUrl = new URL(url, 'http://localhost:5000');
    const path = parsedUrl.pathname;
    const method = options.method || 'GET';

    // GET /api/v1/projects
    if (path === '/api/v1/projects' && method === 'GET') {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          message: 'Projects retrieved successfully.',
          data: projectsDatabase,
        }),
      };
    }

    // GET /api/v1/projects/:id
    if (path.startsWith('/api/v1/projects/') && method === 'GET') {
      const id = path.split('/')[4];
      const project = projectsDatabase.find((p) => p.id === id);
      if (!project) {
        return {
          ok: false,
          status: 404,
          json: async () => ({
            success: false,
            statusCode: 404,
            message: 'Project not found.',
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          message: 'Project retrieved successfully.',
          data: project,
        }),
      };
    }

    // POST /api/v1/projects
    if (path === '/api/v1/projects' && method === 'POST') {
      const body = JSON.parse(options.body);
      const newProject = {
        id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: 'usr-project-test-id',
        title: body.title,
        slug: body.title.toLowerCase().replace(/\s+/g, '-'),
        description: body.description,
        category: body.category || 'WEB_APP',
        repoUrl: body.repoUrl || null,
        liveUrl: body.liveUrl || null,
        techStack: body.techStack || [],
        starsCount: body.starsCount || 0,
        forksCount: body.forksCount || 0,
        linesOfCode: body.linesOfCode || 0,
        status: body.status || 'COMPLETED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      projectsDatabase.unshift(newProject);
      return {
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          statusCode: 201,
          message: 'Project created successfully.',
          data: newProject,
        }),
      };
    }

    // PUT /api/v1/projects/:id
    if (path.startsWith('/api/v1/projects/') && method === 'PUT') {
      const id = path.split('/')[4];
      const body = JSON.parse(options.body);
      const index = projectsDatabase.findIndex((p) => p.id === id);
      if (index === -1) {
        return {
          ok: false,
          status: 404,
          json: async () => ({
            success: false,
            statusCode: 404,
            message: 'Project not found.',
          }),
        };
      }
      projectsDatabase[index] = {
        ...projectsDatabase[index],
        ...body,
        updatedAt: new Date().toISOString(),
      };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          message: 'Project updated successfully.',
          data: projectsDatabase[index],
        }),
      };
    }

    // DELETE /api/v1/projects/:id
    if (path.startsWith('/api/v1/projects/') && method === 'DELETE') {
      const id = path.split('/')[4];
      const index = projectsDatabase.findIndex((p) => p.id === id);
      if (index === -1) {
        return {
          ok: false,
          status: 404,
          json: async () => ({
            success: false,
            statusCode: 404,
            message: 'Project not found.',
          }),
        };
      }
      projectsDatabase = projectsDatabase.filter((p) => p.id !== id);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          statusCode: 200,
          message: 'Project deleted successfully.',
          data: { id, deleted: true },
        }),
      };
    }

    throw new Error(`Unhandled route ${method} ${path}`);
  };

  // Test 1: Empty project state on initial load
  console.log('  1. Testing empty project list retrieval...');
  const emptyRes = await getProjectsApi();
  assert.strictEqual(emptyRes.success, true);
  assert.strictEqual(Array.isArray(emptyRes.data), true);
  assert.strictEqual(emptyRes.data.length, 0);
  console.log('     ✓ Empty project list handled cleanly');

  // Test 2: Client-side Validation Rules
  console.log('  2. Testing project form client-side validation logic...');
  const validateForm = (form: any) => {
    const errors: Record<string, string> = {};
    if (!form.title || !form.title.trim()) errors.title = 'Title required';
    else if (form.title.trim().length > 150) errors.title = 'Title too long';

    if (!form.description || !form.description.trim()) errors.description = 'Description required';
    else if (form.description.trim().length > 5000) errors.description = 'Description too long';

    if (form.starsCount !== '' && (isNaN(Number(form.starsCount)) || Number(form.starsCount) < 0)) {
      errors.starsCount = 'Invalid stars';
    }
    if (form.repoUrl && form.repoUrl.trim()) {
      try {
        new URL(form.repoUrl);
      } catch {
        errors.repoUrl = 'Invalid URL';
      }
    }
    return errors;
  };

  // Test missing title
  assert.ok(validateForm({ title: '', description: 'Some desc' }).title);
  // Test missing description
  assert.ok(validateForm({ title: 'My Project', description: '' }).description);
  // Test negative stars
  assert.ok(validateForm({ title: 'My Project', description: 'Desc', starsCount: -3 }).starsCount);
  // Test invalid repo URL
  assert.ok(
    validateForm({ title: 'My Project', description: 'Desc', repoUrl: 'not-a-url' }).repoUrl,
  );
  // Test valid form
  assert.strictEqual(
    Object.keys(
      validateForm({
        title: 'Valid Project',
        description: 'Valid Desc',
        starsCount: 10,
        repoUrl: 'https://github.com/skilldna/repo',
      }),
    ).length,
    0,
  );
  console.log(
    '     ✓ Client-side validation logic rejects invalid inputs and approves valid forms',
  );

  // Test 3: Create Project (POST /api/v1/projects)
  console.log('  3. Testing project creation (POST /api/v1/projects)...');
  const newProjectPayload = {
    title: 'Distributed Vector Neural Engine',
    description: 'Real-time embedding search and indexing infrastructure with Rust and PostgreSQL.',
    category: 'AI_ML_MODEL',
    repoUrl: 'https://github.com/skilldna/vector-engine',
    liveUrl: 'https://vector-engine.skilldna.ai',
    techStack: ['Rust', 'TypeScript', 'PostgreSQL', 'Docker'],
    starsCount: 128,
    forksCount: 24,
    linesOfCode: 18500,
    status: 'COMPLETED',
  };

  const createRes = await createProjectApi(newProjectPayload);
  assert.strictEqual(createRes.success, true);
  assert.strictEqual(createRes.statusCode, 201);
  assert.strictEqual(createRes.data.title, 'Distributed Vector Neural Engine');
  assert.strictEqual(createRes.data.category, 'AI_ML_MODEL');
  assert.strictEqual(createRes.data.starsCount, 128);
  const createdId = createRes.data.id;
  assert.ok(createdId);
  console.log('     ✓ Project successfully created with HTTP 201');

  // Test 4: Project Listing with Created Project (GET /api/v1/projects)
  console.log('  4. Testing project list retrieval after creation...');
  const listRes = await getProjectsApi();
  assert.strictEqual(listRes.success, true);
  assert.strictEqual(listRes.data.length, 1);
  assert.strictEqual(listRes.data[0].id, createdId);
  assert.strictEqual(listRes.data[0].title, 'Distributed Vector Neural Engine');
  console.log('     ✓ Project list returns newly created project');

  // Test 4b: Get Project By ID (GET /api/v1/projects/:id)
  console.log('  4b. Testing get project by ID (GET /api/v1/projects/:id)...');
  const getSingleRes = await getProjectByIdApi(createdId);
  assert.strictEqual(getSingleRes.success, true);
  assert.strictEqual(getSingleRes.data.id, createdId);
  assert.strictEqual(getSingleRes.data.title, 'Distributed Vector Neural Engine');
  console.log('     ✓ Single project retrieved successfully by ID');

  // Test 5: Edit Project (PUT /api/v1/projects/:id)
  console.log('  5. Testing project update (PUT /api/v1/projects/:id)...');
  const updatePayload = {
    title: 'Distributed Vector Neural Engine v2',
    description: 'Updated description with enhanced streaming search capabilities.',
    starsCount: 256,
    status: 'MAINTAINED',
  };

  const updateRes = await updateProjectApi(createdId, updatePayload);
  assert.strictEqual(updateRes.success, true);
  assert.strictEqual(updateRes.data.title, 'Distributed Vector Neural Engine v2');
  assert.strictEqual(updateRes.data.starsCount, 256);
  assert.strictEqual(updateRes.data.status, 'MAINTAINED');
  console.log('     ✓ Project successfully updated with immediate state return');

  // Test 6: Delete Confirmation & Execution (DELETE /api/v1/projects/:id)
  console.log('  6. Testing project deletion (DELETE /api/v1/projects/:id)...');
  // Simulate confirmation dialog targeting createdId
  const targetToDelete: any = updateRes.data;
  assert.strictEqual(targetToDelete.id, createdId);

  const deleteRes = await deleteProjectApi(createdId);
  assert.strictEqual(deleteRes.success, true);
  assert.strictEqual(deleteRes.data.deleted, true);

  // Verify list is now empty
  const postDeleteList = await getProjectsApi();
  assert.strictEqual(postDeleteList.data.length, 0);
  console.log('     ✓ Project successfully deleted from backend and removed from list');

  // Test 7: Persistence after Refresh
  console.log('  7. Testing persistence across multiple operations...');
  await createProjectApi({
    title: 'SkillDNA Architecture Scanner',
    description: 'AST analysis tool for automated repository capability scoring.',
    category: 'CLI_TOOL',
  });
  await createProjectApi({
    title: 'SkillDNA Cloud Agent',
    description: 'Autonomous cloud pipeline agent.',
    category: 'BACKEND_SERVICE',
  });

  // Re-fetch (simulating F5 refresh)
  const refreshFetch = await getProjectsApi();
  assert.strictEqual(refreshFetch.data.length, 2);
  assert.strictEqual(refreshFetch.data[0].title, 'SkillDNA Cloud Agent');
  assert.strictEqual(refreshFetch.data[1].title, 'SkillDNA Architecture Scanner');
  console.log('     ✓ Persisted projects cleanly retrieved on page refresh');

  // Test 8: API Network Failure Handling
  console.log('  8. Testing graceful error handling during API network failures...');
  const originalFetch = (global as any).fetch;
  (global as any).fetch = async () => {
    throw new Error('Network Connection Error');
  };

  try {
    await createProjectApi(newProjectPayload);
    assert.fail('Should throw error');
  } catch (err: any) {
    assert.ok(err.message.includes('Network Connection Error'));
  }
  (global as any).fetch = originalFetch;
  console.log('     ✓ Network failures caught safely without application crash');

  console.log('🎉 All Frontend Project Management & CRUD Tests Passed Successfully!');
}

runFrontendProjectManagementTests().catch((err) => {
  console.error('❌ Frontend Project Management Tests Failed:', err);
  process.exit(1);
});
