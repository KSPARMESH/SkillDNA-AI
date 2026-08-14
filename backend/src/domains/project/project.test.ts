import assert from 'node:assert';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@skilldna/database';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { AuthService } from '../auth/auth.service';
import { authenticate } from '../../middleware/auth.middleware';
import { AppError, HttpStatusCode, ApiErrorCode, ProjectCategory } from '@skilldna/shared';

function createMockExpressContext(
  authHeader?: string,
  body: any = {},
  params: Record<string, string> = {},
) {
  const req = {
    headers: {
      ...(authHeader ? { authorization: authHeader } : {}),
    },
    body,
    params,
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

async function runProjectDomainTests() {
  console.log('🧪 Running Comprehensive Backend Project Domain Integration Tests...');

  // Setup User 1 (Owner)
  const user1Email = `project.owner.${Date.now()}@skilldna.ai`;
  const user1Auth = await AuthService.register({
    email: user1Email,
    password: 'Password123!',
    firstName: 'Project',
    lastName: 'Owner',
  });
  const user1Id = user1Auth.user.id;
  const user1Token = user1Auth.accessToken;

  // Setup User 2 (Attacker / Different User)
  const user2Email = `project.other.${Date.now()}@skilldna.ai`;
  const user2Auth = await AuthService.register({
    email: user2Email,
    password: 'Password123!',
    firstName: 'Other',
    lastName: 'User',
  });
  const user2Id = user2Auth.user.id;
  const user2Token = user2Auth.accessToken;

  let createdProjectId = '';

  // Test 1: Authenticated Project Creation (POST /api/v1/projects)
  {
    console.log('  1. Testing authenticated project creation...');
    const projectPayload = {
      title: 'SkillDNA Core AI Engine',
      description: 'Distributed AI agent framework scoring code contributions and architecture.',
      category: ProjectCategory.AI_ML_MODEL,
      repoUrl: 'https://github.com/skilldna/core-ai',
      liveUrl: 'https://skilldna.ai/demo',
      techStack: ['TypeScript', 'Node.js', 'Prisma', 'PostgreSQL'],
      starsCount: 42,
      forksCount: 8,
      linesOfCode: 15400,
      status: 'ACTIVE',
    };

    const ctx = createMockExpressContext(`Bearer ${user1Token}`, projectPayload);
    authenticate(ctx.req, ctx.res, ctx.next);
    assert.strictEqual(ctx.getError(), null, 'Authentication should succeed');

    await ProjectController.create(ctx.req, ctx.res, ctx.next);
    assert.strictEqual(ctx.getError(), null, 'Project creation should not produce error');
    assert.strictEqual(ctx.getStatusCode(), 201, 'Project creation should return HTTP 201');

    const res = ctx.getResponse();
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.title, 'SkillDNA Core AI Engine');
    assert.strictEqual(res.data.slug, 'skilldna-core-ai-engine');
    assert.strictEqual(res.data.userId, user1Id, 'Project must belong to authenticated user 1');
    assert.strictEqual(res.data.category, ProjectCategory.AI_ML_MODEL);
    assert.strictEqual(res.data.starsCount, 42);

    createdProjectId = res.data.id;
    assert.ok(createdProjectId, 'Created project should have an ID');
    console.log('     ✓ Project created successfully with auto-generated slug and HTTP 201');
  }

  // Test 2: Unauthenticated Project Creation (Missing Auth Header)
  {
    console.log('  2. Testing unauthenticated project creation rejection...');
    const ctx = createMockExpressContext(undefined, {
      title: 'Hacked Project',
      description: 'Unauthorized creation attempt',
    });

    authenticate(ctx.req, ctx.res, ctx.next);
    const err = ctx.getError();
    assert.ok(err instanceof AppError, 'Missing auth header should yield AppError');
    assert.strictEqual(err.statusCode, HttpStatusCode.UNAUTHORIZED);
    assert.strictEqual(err.errorCode, ApiErrorCode.AUTHENTICATION_FAILED);
    console.log('     ✓ Unauthenticated request rejected with 401 UNAUTHORIZED');
  }

  // Test 3: Project Listing For Current User (GET /api/v1/projects)
  {
    console.log('  3. Testing project listing for current user...');
    // Create a 2nd project for User 1
    await ProjectService.createProject(user1Id, {
      title: 'SkillDNA Worker Pipeline',
      description: 'Background async job worker pipeline.',
      category: ProjectCategory.BACKEND_SERVICE,
    });

    // Create a project for User 2 (must not be visible to User 1)
    await ProjectService.createProject(user2Id, {
      title: 'User 2 Secret Project',
      description: 'Private project for user 2.',
      category: ProjectCategory.CLI_TOOL,
    });

    const ctx = createMockExpressContext(`Bearer ${user1Token}`);
    authenticate(ctx.req, ctx.res, ctx.next);
    await ProjectController.list(ctx.req, ctx.res, ctx.next);

    assert.strictEqual(ctx.getError(), null);
    assert.strictEqual(ctx.getStatusCode(), 200);

    const res = ctx.getResponse();
    assert.strictEqual(res.success, true);
    assert.strictEqual(Array.isArray(res.data), true);
    assert.strictEqual(res.data.length, 2, 'User 1 should see exactly 2 projects');
    for (const proj of res.data) {
      assert.strictEqual(proj.userId, user1Id, 'All listed projects must belong to user 1');
    }
    console.log('     ✓ Project list securely filtered by user ID (returns only own projects)');
  }

  // Test 4: Project Retrieval By Owner (GET /api/v1/projects/:id)
  {
    console.log('  4. Testing project retrieval by owner...');
    const ctx = createMockExpressContext(`Bearer ${user1Token}`, {}, { id: createdProjectId });
    authenticate(ctx.req, ctx.res, ctx.next);
    await ProjectController.getById(ctx.req, ctx.res, ctx.next);

    assert.strictEqual(ctx.getError(), null);
    assert.strictEqual(ctx.getStatusCode(), 200);
    const res = ctx.getResponse();
    assert.strictEqual(res.data.id, createdProjectId);
    assert.strictEqual(res.data.userId, user1Id);
    console.log('     ✓ Project retrieved successfully by owner');
  }

  // Test 5: Project Retrieval Denied For Another User (GET /api/v1/projects/:id)
  {
    console.log('  5. Testing cross-user project retrieval denial...');
    const ctx = createMockExpressContext(`Bearer ${user2Token}`, {}, { id: createdProjectId });
    authenticate(ctx.req, ctx.res, ctx.next);
    await ProjectController.getById(ctx.req, ctx.res, ctx.next);

    const err = ctx.getError();
    assert.ok(err instanceof AppError, 'Cross-user access should throw AppError');
    assert.strictEqual(err.statusCode, HttpStatusCode.FORBIDDEN);
    assert.strictEqual(err.errorCode, ApiErrorCode.PERMISSION_DENIED);
    console.log('     ✓ Cross-user project retrieval rejected with 403 FORBIDDEN');
  }

  // Test 6: Project Update By Owner (PUT /api/v1/projects/:id)
  {
    console.log('  6. Testing project update by owner...');
    const updatePayload = {
      title: 'SkillDNA Next-Gen Core AI',
      starsCount: 150,
      status: 'PRODUCTION',
    };

    const ctx = createMockExpressContext(`Bearer ${user1Token}`, updatePayload, {
      id: createdProjectId,
    });
    authenticate(ctx.req, ctx.res, ctx.next);
    await ProjectController.update(ctx.req, ctx.res, ctx.next);

    assert.strictEqual(ctx.getError(), null);
    assert.strictEqual(ctx.getStatusCode(), 200);
    const res = ctx.getResponse();
    assert.strictEqual(res.data.title, 'SkillDNA Next-Gen Core AI');
    assert.strictEqual(res.data.slug, 'skilldna-next-gen-core-ai');
    assert.strictEqual(res.data.starsCount, 150);
    assert.strictEqual(res.data.status, 'PRODUCTION');
    console.log('     ✓ Project updated successfully with updated slug by owner');
  }

  // Test 7: Project Update Denied For Another User (PUT /api/v1/projects/:id)
  {
    console.log('  7. Testing cross-user project update denial...');
    const ctx = createMockExpressContext(
      `Bearer ${user2Token}`,
      { title: 'Malicious Update' },
      { id: createdProjectId },
    );
    authenticate(ctx.req, ctx.res, ctx.next);
    await ProjectController.update(ctx.req, ctx.res, ctx.next);

    const err = ctx.getError();
    assert.ok(err instanceof AppError);
    assert.strictEqual(err.statusCode, HttpStatusCode.FORBIDDEN);
    assert.strictEqual(err.errorCode, ApiErrorCode.PERMISSION_DENIED);
    console.log('     ✓ Cross-user project update rejected with 403 FORBIDDEN');
  }

  // Test 8: Project Deletion Denied For Another User (DELETE /api/v1/projects/:id)
  {
    console.log('  8. Testing cross-user project deletion denial...');
    const ctx = createMockExpressContext(`Bearer ${user2Token}`, {}, { id: createdProjectId });
    authenticate(ctx.req, ctx.res, ctx.next);
    await ProjectController.delete(ctx.req, ctx.res, ctx.next);

    const err = ctx.getError();
    assert.ok(err instanceof AppError);
    assert.strictEqual(err.statusCode, HttpStatusCode.FORBIDDEN);
    assert.strictEqual(err.errorCode, ApiErrorCode.PERMISSION_DENIED);
    console.log('     ✓ Cross-user project deletion rejected with 403 FORBIDDEN');
  }

  // Test 9: Project Deletion By Owner (DELETE /api/v1/projects/:id)
  {
    console.log('  9. Testing project deletion by owner...');
    const ctx = createMockExpressContext(`Bearer ${user1Token}`, {}, { id: createdProjectId });
    authenticate(ctx.req, ctx.res, ctx.next);
    await ProjectController.delete(ctx.req, ctx.res, ctx.next);

    assert.strictEqual(ctx.getError(), null);
    assert.strictEqual(ctx.getStatusCode(), 200);
    const res = ctx.getResponse();
    assert.strictEqual(res.data.id, createdProjectId);
    assert.strictEqual(res.data.deleted, true);

    // Verify deletion from DB
    const checkDb = await prisma.project.findUnique({ where: { id: createdProjectId } });
    assert.strictEqual(checkDb, null, 'Project must no longer exist in DB');
    console.log('     ✓ Project successfully deleted by owner');
  }

  // Test 10: Duplicate Slug Handling (Collision Resolution)
  {
    console.log('  10. Testing duplicate slug collision resolution...');
    const proj1 = await ProjectService.createProject(user1Id, {
      title: 'Duplicate Slug Test',
      description: 'Project 1 with base title',
    });
    const proj2 = await ProjectService.createProject(user1Id, {
      title: 'Duplicate Slug Test',
      description: 'Project 2 with identical base title',
    });
    const proj3 = await ProjectService.createProject(user1Id, {
      title: 'Duplicate Slug Test',
      description: 'Project 3 with identical base title',
    });

    assert.strictEqual(proj1.slug, 'duplicate-slug-test');
    assert.strictEqual(proj2.slug, 'duplicate-slug-test-2');
    assert.strictEqual(proj3.slug, 'duplicate-slug-test-3');
    console.log('     ✓ Duplicate slugs resolved deterministically with suffix numbers (-2, -3)');
  }

  // Test 11: Invalid Input Handling
  {
    console.log('  11. Testing invalid input validation rejection...');

    // Missing title
    const ctxNoTitle = createMockExpressContext(`Bearer ${user1Token}`, {
      description: 'Missing title',
    });
    authenticate(ctxNoTitle.req, ctxNoTitle.res, ctxNoTitle.next);
    await ProjectController.create(ctxNoTitle.req, ctxNoTitle.res, ctxNoTitle.next);
    const errNoTitle = ctxNoTitle.getError();
    assert.ok(errNoTitle instanceof AppError);
    assert.strictEqual(errNoTitle.statusCode, HttpStatusCode.BAD_REQUEST);

    // Invalid category
    const ctxBadCat = createMockExpressContext(`Bearer ${user1Token}`, {
      title: 'Valid Title',
      description: 'Valid Desc',
      category: 'INVALID_CATEGORY_XYZ',
    });
    authenticate(ctxBadCat.req, ctxBadCat.res, ctxBadCat.next);
    await ProjectController.create(ctxBadCat.req, ctxBadCat.res, ctxBadCat.next);
    const errBadCat = ctxBadCat.getError();
    assert.ok(errBadCat instanceof AppError);
    assert.strictEqual(errBadCat.statusCode, HttpStatusCode.BAD_REQUEST);

    // Negative metric
    const ctxNegStars = createMockExpressContext(`Bearer ${user1Token}`, {
      title: 'Valid Title',
      description: 'Valid Desc',
      starsCount: -5,
    });
    authenticate(ctxNegStars.req, ctxNegStars.res, ctxNegStars.next);
    await ProjectController.create(ctxNegStars.req, ctxNegStars.res, ctxNegStars.next);
    const errNegStars = ctxNegStars.getError();
    assert.ok(errNegStars instanceof AppError);
    assert.strictEqual(errNegStars.statusCode, HttpStatusCode.BAD_REQUEST);

    console.log('     ✓ Invalid payloads rejected with 400 BAD_REQUEST and detailed error reasons');
  }

  console.log('🎉 All Backend Project Domain Integration Tests Passed Successfully!');
}

runProjectDomainTests()
  .catch((err) => {
    console.error('❌ Project Domain Tests Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
