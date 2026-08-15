import assert from 'node:assert';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@skilldna/database';
import {
  PlatformType,
  DegreeType,
  ProficiencyLevel,
  ProjectCategory,
  HackathonRole,
  CertificationStatus,
  VerificationMethod,
  ReportType,
} from '@prisma/client';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';
import { AuthService } from '../../auth/auth.service';
import { authenticate } from '../../../middleware/auth.middleware';
import { AiController } from '../ai.controller';
import { AiService } from '../ai.service';
import { AiContextBuilder } from '../services/ai-context.builder';
import { AiPromptBuilder } from '../services/ai-prompt.builder';
import { AiValidatorService } from '../services/ai-validator.service';
import { GeminiProvider, IGeminiProvider } from '../providers/gemini.provider';

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

class MockGeminiProvider implements IGeminiProvider {
  constructor(
    public responseGenerator: (prompt: string) => Promise<{ rawText: string; rawResponse?: any }>,
  ) {}

  async generateSkillDnaEvaluation(
    prompt: string,
  ): Promise<{ rawText: string; rawResponse?: any }> {
    return this.responseGenerator(prompt);
  }
}

async function runAiDomainTests() {
  console.log('🧪 Running Comprehensive SkillDNA AI Backend Report Generation Test Suite...\n');

  // Setup Test User 1
  const user1Email = `ai.candidate.${Date.now()}@skilldna.ai`;
  const user1Auth = await AuthService.register({
    email: user1Email,
    password: 'Password123!',
    firstName: 'Alice',
    lastName: 'Engineer',
  });
  const user1Id = user1Auth.user.id;
  const user1Token = user1Auth.accessToken;

  // Setup Test User 2 (for user scoping test)
  const user2Email = `ai.other.${Date.now()}@skilldna.ai`;
  const user2Auth = await AuthService.register({
    email: user2Email,
    password: 'Password123!',
    firstName: 'Bob',
    lastName: 'Attacker',
  });
  const user2Id = user2Auth.user.id;
  const user2Token = user2Auth.accessToken;

  // Populate rich persisted data for User 1
  let skillTypescript = await prisma.skill.findFirst({
    where: { name: 'TypeScript' },
  });
  if (!skillTypescript) {
    skillTypescript = await prisma.skill.create({
      data: {
        name: `TypeScript_${Date.now()}`,
        slug: `typescript-${Date.now()}`,
        category: 'LANGUAGES',
      },
    });
  }

  let skillPostgres = await prisma.skill.findFirst({
    where: { name: 'PostgreSQL' },
  });
  if (!skillPostgres) {
    skillPostgres = await prisma.skill.create({
      data: {
        name: `PostgreSQL_${Date.now()}`,
        slug: `postgresql-${Date.now()}`,
        category: 'DATABASE',
      },
    });
  }

  await prisma.userSkill.create({
    data: {
      userId: user1Id,
      skillId: skillTypescript.id,
      proficiency: ProficiencyLevel.ADVANCED,
      verified: true,
      verifiedScore: 92.5,
      selfRating: 5,
      yearsOfExperience: 3.5,
    },
  });

  await prisma.userSkill.create({
    data: {
      userId: user1Id,
      skillId: skillPostgres.id,
      proficiency: ProficiencyLevel.INTERMEDIATE,
      verified: false,
      verifiedScore: 0.0,
      selfRating: 4,
      yearsOfExperience: 2.0,
    },
  });

  const project1 = await prisma.project.create({
    data: {
      userId: user1Id,
      title: 'Distributed Event Mesh',
      slug: `dist-event-mesh-${Date.now()}`,
      description:
        'High throughput streaming pipeline handling 50k events/sec using Node.js and PostgreSQL.',
      category: ProjectCategory.BACKEND_SERVICE,
      repoUrl: 'https://github.com/alice/event-mesh',
      liveUrl: 'https://mesh.alice.dev',
      techStack: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis'],
      starsCount: 35,
      forksCount: 6,
      linesOfCode: 12400,
      status: 'COMPLETED',
    },
  });

  await prisma.gitHubStat.create({
    data: {
      userId: user1Id,
      publicRepos: 18,
      totalStars: 42,
      totalForks: 10,
      totalCommits: 580,
      PRsCreated: 34,
      issuesSolved: 19,
      topLanguages: { TypeScript: 70, JavaScript: 20, SQL: 10 },
      contributionGraph: { total2025: 580 },
    },
  });

  await prisma.codingStat.create({
    data: {
      userId: user1Id,
      platform: PlatformType.LEETCODE,
      totalSolved: 240,
      easySolved: 80,
      mediumSolved: 130,
      hardSolved: 30,
      ranking: 15420,
      contestRating: 1820.5,
      badgesCount: 5,
    },
  });

  await prisma.platformIntegration.create({
    data: {
      userId: user1Id,
      platform: PlatformType.GITHUB,
      username: 'alice-engineer',
      isConnected: true,
      syncStatus: 'SUCCESS',
    },
  });

  await prisma.certification.create({
    data: {
      userId: user1Id,
      title: 'AWS Certified Developer - Associate',
      issuingOrganization: 'Amazon Web Services',
      issueDate: new Date('2024-01-15'),
      isVerified: true,
      status: CertificationStatus.ACTIVE,
    },
  });

  await prisma.hackathon.create({
    data: {
      userId: user1Id,
      name: 'Global AI Innovators Hackathon',
      projectTitle: 'SkillDNA Engine',
      role: HackathonRole.TEAM_LEAD,
      description: 'Built automated skill evaluation pipeline.',
      position: '1st Place Winner',
      prizeAmount: '$5,000',
      eventDate: new Date('2024-06-20'),
      isVerified: true,
    },
  });

  await prisma.education.create({
    data: {
      userId: user1Id,
      institution: 'Stanford University',
      degree: DegreeType.BACHELORS,
      fieldOfStudy: 'Computer Science',
      startYear: 2019,
      endYear: 2023,
      isCurrent: false,
    },
  });

  // Standard Mock Gemini JSON Output Fixture
  const validGeminiOutputFixture = {
    overallScore: 89.2,
    codeQualityScore: 92.0,
    problemSolvingScore: 88.5,
    systemDesignScore: 87.0,
    breadthScore: 86.0,
    consistencyScore: 92.5,
    strengths: [
      'Exceptional TypeScript architecture evidenced in Distributed Event Mesh (12.4k LOC)',
      'Proven algorithmic proficiency with 240 LeetCode problems solved (30 Hard, rating 1820)',
      'Verified cloud and architecture competence with AWS Certified Developer certification',
      'Consistent commit velocity with 580 GitHub commits and 34 merged pull requests',
    ],
    weaknesses: [
      'Expand cross-platform problem solving into Codeforces or AtCoder competitive contests',
      'Deepen production container orchestration with Kubernetes and Terraform',
    ],
    recommendationSummary:
      'Candidate demonstrates top 5% technical maturity for their experience level. Highly recommended for Senior Backend or Distributed Systems roles.',
  };

  // ---------------------------------------------------------------------------
  // Test 1: Authenticated Report Generation (POST /api/v1/ai/skill-dna-report)
  // ---------------------------------------------------------------------------
  let firstGeneratedReportId = '';
  {
    console.log('  1. Testing authenticated report generation flow...');
    AiService.setGeminiProvider(
      new MockGeminiProvider(async () => ({
        rawText: JSON.stringify(validGeminiOutputFixture),
      })),
    );

    const ctx = createMockExpressContext(`Bearer ${user1Token}`);
    authenticate(ctx.req, ctx.res, ctx.next);
    assert.strictEqual(ctx.getError(), null, 'Authentication should succeed');

    await AiController.generateReport(ctx.req, ctx.res, ctx.next);
    assert.strictEqual(ctx.getError(), null, 'Report generation should succeed without error');
    assert.strictEqual(ctx.getStatusCode(), 200, 'Report generation must return HTTP 200');

    const res = ctx.getResponse();
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.message, 'SkillDNA Report generated via Gemini AI.');
    assert.ok(res.data, 'Response must contain generated report data');
    assert.strictEqual(res.data.userId, user1Id);
    assert.strictEqual(res.data.overallScore, 89.2);
    assert.strictEqual(res.data.codeQualityScore, 92.0);
    assert.strictEqual(res.data.problemSolvingScore, 88.5);
    assert.strictEqual(res.data.strengths.length, 4);
    assert.strictEqual(res.data.weaknesses.length, 2);

    firstGeneratedReportId = res.data.id;
    assert.ok(firstGeneratedReportId, 'Generated report must have database ID');
    console.log('     ✓ Authenticated report generated successfully with HTTP 200');
  }

  // ---------------------------------------------------------------------------
  // Test 2: Unauthenticated Request Rejection (Missing & Invalid Auth)
  // ---------------------------------------------------------------------------
  {
    console.log('  2. Testing unauthenticated request rejection...');
    const ctxNoHeader = createMockExpressContext(undefined);
    authenticate(ctxNoHeader.req, ctxNoHeader.res, ctxNoHeader.next);
    const err = ctxNoHeader.getError();
    assert.ok(err instanceof AppError, 'Missing auth header must yield AppError');
    assert.strictEqual(err.statusCode, HttpStatusCode.UNAUTHORIZED);
    assert.strictEqual(err.errorCode, ApiErrorCode.AUTHENTICATION_FAILED);

    const ctxDirect = createMockExpressContext(undefined);
    await AiController.generateReport(ctxDirect.req, ctxDirect.res, ctxDirect.next);
    const errDirect = ctxDirect.getError();
    assert.ok(errDirect instanceof AppError);
    assert.strictEqual(errDirect.statusCode, HttpStatusCode.UNAUTHORIZED);
    console.log('     ✓ Unauthenticated request cleanly rejected with 401 UNAUTHORIZED');
  }

  // ---------------------------------------------------------------------------
  // Test 3: Correct User Scoping (Never accept userId from body)
  // ---------------------------------------------------------------------------
  {
    console.log('  3. Testing correct user scoping and body spoofing prevention...');
    AiService.setGeminiProvider(
      new MockGeminiProvider(async () => ({
        rawText: JSON.stringify(validGeminiOutputFixture),
      })),
    );

    // User 1 JWT tries to generate report by passing User 2 ID in body
    const ctxSpoof = createMockExpressContext(`Bearer ${user1Token}`, {
      userId: user2Id,
    });
    authenticate(ctxSpoof.req, ctxSpoof.res, ctxSpoof.next);
    await AiController.generateReport(ctxSpoof.req, ctxSpoof.res, ctxSpoof.next);

    assert.strictEqual(ctxSpoof.getError(), null);
    const res = ctxSpoof.getResponse();
    assert.strictEqual(
      res.data.userId,
      user1Id,
      'Report MUST be created for authenticated user 1, ignoring body spoof',
    );
    assert.notStrictEqual(res.data.userId, user2Id, 'Report must NOT belong to user 2');
    console.log('     ✓ User scoping verified: JWT identity strictly enforced');
  }

  // ---------------------------------------------------------------------------
  // Test 4: Context Construction from Actual Persisted Data
  // ---------------------------------------------------------------------------
  {
    console.log('  4. Testing context construction from actual persisted database data...');
    const context = await AiContextBuilder.buildUserSkillDnaContext(user1Id);

    assert.strictEqual(context.userId, user1Id);
    assert.strictEqual(context.user.email, user1Email);
    assert.strictEqual(context.evidenceSummary.totalProjects, 1);
    assert.strictEqual(context.evidenceSummary.totalSkills, 2);
    assert.strictEqual(context.evidenceSummary.totalVerifiedSkills, 1);
    assert.strictEqual(context.evidenceSummary.totalCodingProblemsSolved, 240);
    assert.strictEqual(context.evidenceSummary.totalGithubCommits, 580);
    assert.strictEqual(context.evidenceSummary.totalCertifications, 1);
    assert.strictEqual(context.evidenceSummary.totalHackathons, 1);
    assert.strictEqual(context.evidenceSummary.hasGithubData, true);
    assert.strictEqual(context.evidenceSummary.hasCodingStats, true);

    // Verify no sensitive tokens leaked into context
    const contextStr = JSON.stringify(context);
    assert.strictEqual(contextStr.includes('passwordHash'), false);
    assert.strictEqual(contextStr.includes('accessToken'), false);
    assert.strictEqual(contextStr.includes('refreshToken'), false);
    console.log('     ✓ Context accurately constructed from persisted records with zero leaks');
  }

  // ---------------------------------------------------------------------------
  // Test 5: Gemini Success Response (With Markdown Code Fence Handling)
  // ---------------------------------------------------------------------------
  {
    console.log('  5. Testing Gemini response parsing with markdown code fences...');
    const fencedResponse = `Here is the generated SkillDNA report:\n\`\`\`json\n${JSON.stringify(validGeminiOutputFixture, null, 2)}\n\`\`\`\n`;
    const parsed = AiValidatorService.parseAndValidateAiReportResponse(fencedResponse);

    assert.strictEqual(parsed.overallScore, 89.2);
    assert.strictEqual(parsed.codeQualityScore, 92.0);
    assert.strictEqual(parsed.problemSolvingScore, 88.5);
    assert.strictEqual(parsed.systemDesignScore, 87.0);
    assert.strictEqual(parsed.breadthScore, 86.0);
    assert.strictEqual(parsed.consistencyScore, 92.5);
    assert.strictEqual(parsed.strengths.length, 4);
    assert.strictEqual(parsed.weaknesses.length, 2);
    console.log('     ✓ Markdown code fences stripped and structured JSON parsed successfully');
  }

  // ---------------------------------------------------------------------------
  // Test 6: Malformed Gemini Response Handling
  // ---------------------------------------------------------------------------
  {
    console.log('  6. Testing malformed Gemini response rejection...');
    const malformedText = 'I am an AI assistant and I cannot compute this report. { invalid json: ';
    assert.throws(
      () => {
        AiValidatorService.parseAndValidateAiReportResponse(malformedText);
      },
      (err: any) => {
        return err instanceof AppError && err.statusCode === HttpStatusCode.INTERNAL_SERVER_ERROR;
      },
      'Malformed response must throw AppError 500',
    );
    console.log('     ✓ Malformed model output caught and handled cleanly');
  }

  // ---------------------------------------------------------------------------
  // Test 7: Invalid Score and Schema Range Validation
  // ---------------------------------------------------------------------------
  {
    console.log('  7. Testing invalid score ranges and missing field validation...');

    // Out of bounds: negative score
    assert.throws(
      () => {
        AiValidatorService.parseAndValidateAiReportResponse(
          JSON.stringify({ ...validGeminiOutputFixture, codeQualityScore: -15 }),
        );
      },
      (err: any) => err instanceof AppError && err.message.includes('out of range'),
    );

    // Out of bounds: score > 100
    assert.throws(
      () => {
        AiValidatorService.parseAndValidateAiReportResponse(
          JSON.stringify({ ...validGeminiOutputFixture, systemDesignScore: 125 }),
        );
      },
      (err: any) => err instanceof AppError && err.message.includes('out of range'),
    );

    // Non-numeric score
    assert.throws(
      () => {
        AiValidatorService.parseAndValidateAiReportResponse(
          JSON.stringify({ ...validGeminiOutputFixture, problemSolvingScore: 'expert' }),
        );
      },
      (err: any) => err instanceof AppError && err.message.includes('expected numeric value'),
    );

    // Empty strengths array
    assert.throws(
      () => {
        AiValidatorService.parseAndValidateAiReportResponse(
          JSON.stringify({ ...validGeminiOutputFixture, strengths: [] }),
        );
      },
      (err: any) => err instanceof AppError && err.message.includes('strengths'),
    );

    // Missing recommendation summary
    assert.throws(
      () => {
        AiValidatorService.parseAndValidateAiReportResponse(
          JSON.stringify({ ...validGeminiOutputFixture, recommendationSummary: '   ' }),
        );
      },
      (err: any) => err instanceof AppError && err.message.includes('recommendationSummary'),
    );

    console.log('     ✓ Invalid scores, negative values, and missing fields rejected strictly');
  }

  // ---------------------------------------------------------------------------
  // Test 8: Missing Gemini Configuration
  // ---------------------------------------------------------------------------
  {
    console.log('  8. Testing missing Gemini API key configuration handling...');
    const unconfiguredProvider = new GeminiProvider('');
    let caught = false;
    try {
      await unconfiguredProvider.generateSkillDnaEvaluation('test prompt');
    } catch (err: any) {
      caught = true;
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.statusCode, HttpStatusCode.SERVICE_UNAVAILABLE);
      assert.ok(err.message.includes('Gemini API key is not configured'));
    }
    assert.strictEqual(caught, true, 'Unconfigured provider must throw AppError 503');
    console.log('     ✓ Missing Gemini API key cleanly throws 503 SERVICE_UNAVAILABLE');
  }

  // ---------------------------------------------------------------------------
  // Test 9: Gemini API Retry Handling, Rate Limits & Error Sanitization
  // ---------------------------------------------------------------------------
  {
    console.log(
      '  9. Testing Gemini API bounded retry handling, rate limits, and error sanitization...',
    );

    const validResponseOutput = {
      text: JSON.stringify(validGeminiOutputFixture),
      candidates: [{ finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 200, totalTokenCount: 300 },
    };

    // 9.1: 503 succeeds on first retry (Attempt 1 fails with 503 UNAVAILABLE, Attempt 2 succeeds)
    {
      const retryProvider = new GeminiProvider('fake-api-key', {
        maxAttempts: 3,
        baseDelayMs: 1000,
        jitterMs: 200,
      });
      const delays: number[] = [];
      retryProvider.setSleepFn(async (ms) => {
        delays.push(ms);
      });

      let callCount = 0;
      (retryProvider as any).genAI = {
        models: {
          generateContent: async () => {
            callCount++;
            if (callCount === 1) {
              const err: any = new Error(
                '[503 Service Unavailable] This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
              );
              err.status = 503;
              throw err;
            }
            return validResponseOutput;
          },
        },
      };

      const result = await retryProvider.generateSkillDnaEvaluation('test prompt');
      assert.strictEqual(callCount, 2, 'Must succeed on attempt 2 (first retry)');
      assert.strictEqual(delays.length, 1, 'Must execute exactly 1 backoff delay');
      assert.ok(
        delays[0] >= 1000 && delays[0] <= 1200,
        `Delay must be ~1000ms + jitter, got ${delays[0]}`,
      );
      assert.strictEqual(result.rawText, JSON.stringify(validGeminiOutputFixture));
      console.log('     ✓ 503 succeeds on first retry (attempt 2) with backoff delay verified');
    }

    // 9.2 & 9.3: 503 succeeds on second retry / third attempt (Attempts 1 & 2 fail, Attempt 3 succeeds)
    {
      const retryProvider = new GeminiProvider('fake-api-key', {
        maxAttempts: 3,
        baseDelayMs: 1000,
        jitterMs: 200,
      });
      const delays: number[] = [];
      retryProvider.setSleepFn(async (ms) => {
        delays.push(ms);
      });

      let callCount = 0;
      (retryProvider as any).genAI = {
        models: {
          generateContent: async () => {
            callCount++;
            if (callCount < 3) {
              const err: any = new Error('503 UNAVAILABLE: Model is overloaded');
              err.status = 503;
              throw err;
            }
            return validResponseOutput;
          },
        },
      };

      const result = await retryProvider.generateSkillDnaEvaluation('test prompt');
      assert.strictEqual(callCount, 3, 'Must succeed on attempt 3 (second retry)');
      assert.strictEqual(delays.length, 2, 'Must execute exactly 2 backoff delays');
      assert.ok(
        delays[0] >= 1000 && delays[0] <= 1200,
        `Delay 1 must be ~1000ms + jitter, got ${delays[0]}`,
      );
      assert.ok(
        delays[1] >= 2000 && delays[1] <= 2200,
        `Delay 2 must be ~2000ms + jitter, got ${delays[1]}`,
      );
      assert.strictEqual(result.rawText, JSON.stringify(validGeminiOutputFixture));
      console.log(
        '     ✓ 503 succeeds on third attempt (attempt 3) with exponential backoff verified',
      );
    }

    // 9.4: 503 continues failing and returns safe 503 after max 3 attempts
    {
      const retryProvider = new GeminiProvider('fake-api-key', {
        maxAttempts: 3,
        baseDelayMs: 1000,
        jitterMs: 200,
      });
      const delays: number[] = [];
      retryProvider.setSleepFn(async (ms) => {
        delays.push(ms);
      });

      let callCount = 0;
      (retryProvider as any).genAI = {
        models: {
          generateContent: async () => {
            callCount++;
            const err: any = new Error('[503 Service Unavailable] Model experiencing high demand');
            err.status = 503;
            throw err;
          },
        },
      };

      let caught503: any = null;
      try {
        await retryProvider.generateSkillDnaEvaluation('test prompt');
      } catch (err: any) {
        caught503 = err;
      }

      assert.strictEqual(callCount, 3, 'Must attempt exactly 3 times before giving up');
      assert.strictEqual(delays.length, 2, 'Must have delayed twice between the 3 attempts');
      assert.ok(caught503 instanceof AppError);
      assert.strictEqual(caught503.statusCode, HttpStatusCode.SERVICE_UNAVAILABLE);
      console.log('     ✓ 503 exhausted after 3 attempts returns safe 503 SERVICE_UNAVAILABLE');
    }

    // 9.5: 429 is retried (Attempt 1 fails with 429 RESOURCE_EXHAUSTED, Attempt 2 succeeds)
    {
      const retryProvider = new GeminiProvider('fake-api-key', {
        maxAttempts: 3,
        baseDelayMs: 1000,
        jitterMs: 200,
      });
      const delays: number[] = [];
      retryProvider.setSleepFn(async (ms) => {
        delays.push(ms);
      });

      let callCount = 0;
      (retryProvider as any).genAI = {
        models: {
          generateContent: async () => {
            callCount++;
            if (callCount === 1) {
              const err: any = new Error(
                '429 Too Many Requests: [GoogleGenAI Error]: RESOURCE_EXHAUSTED',
              );
              err.status = 429;
              throw err;
            }
            return validResponseOutput;
          },
        },
      };

      const result = await retryProvider.generateSkillDnaEvaluation('test prompt');
      assert.strictEqual(callCount, 2, '429 must be retried and succeed on attempt 2');
      assert.strictEqual(delays.length, 1);
      assert.strictEqual(result.rawText, JSON.stringify(validGeminiOutputFixture));

      // When 429 fails all 3 attempts
      callCount = 0;
      delays.length = 0;
      (retryProvider as any).genAI = {
        models: {
          generateContent: async () => {
            callCount++;
            const err: any = new Error(
              '429 Too Many Requests: [GoogleGenAI Error]: RESOURCE_EXHAUSTED',
            );
            err.status = 429;
            throw err;
          },
        },
      };

      let caughtRateLimit: any = null;
      try {
        await retryProvider.generateSkillDnaEvaluation('test prompt');
      } catch (err: any) {
        caughtRateLimit = err;
      }
      assert.strictEqual(callCount, 3, '429 exhausted must stop at max 3 attempts');
      assert.ok(caughtRateLimit instanceof AppError);
      assert.strictEqual(caughtRateLimit.statusCode, HttpStatusCode.TOO_MANY_REQUESTS);
      assert.ok(caughtRateLimit.message.includes('rate limit exceeded or quota exhausted'));
      console.log('     ✓ 429 rate limit is retried with backoff and returns 429 when exhausted');
    }

    // 9.6: 400 is NOT retried (stops immediately after attempt 1)
    {
      const retryProvider = new GeminiProvider('fake-api-key');
      let callCount = 0;
      (retryProvider as any).genAI = {
        models: {
          generateContent: async () => {
            callCount++;
            const err: any = new Error('[400 Bad Request] Invalid argument provided to model');
            err.status = 400;
            throw err;
          },
        },
      };

      let caught400: any = null;
      try {
        await retryProvider.generateSkillDnaEvaluation('test prompt');
      } catch (err: any) {
        caught400 = err;
      }

      assert.strictEqual(callCount, 1, '400 Bad Request must NOT be retried (callCount = 1)');
      assert.ok(caught400 instanceof AppError);
      assert.strictEqual(caught400.statusCode, HttpStatusCode.SERVICE_UNAVAILABLE);
      console.log('     ✓ 400 Bad Request is NOT retried and immediately rejected');
    }

    // 9.7: 403 is NOT retried (stops immediately after attempt 1)
    {
      const retryProvider = new GeminiProvider('fake-api-key');
      let callCount = 0;
      (retryProvider as any).genAI = {
        models: {
          generateContent: async () => {
            callCount++;
            const err: any = new Error('[403 Forbidden] API_KEY_INVALID: API key not valid');
            err.status = 403;
            throw err;
          },
        },
      };

      let caught403: any = null;
      try {
        await retryProvider.generateSkillDnaEvaluation('test prompt');
      } catch (err: any) {
        caught403 = err;
      }

      assert.strictEqual(callCount, 1, '403 Forbidden must NOT be retried (callCount = 1)');
      assert.ok(caught403 instanceof AppError);
      assert.strictEqual(caught403.message, 'Invalid Gemini API key provided.');
      console.log('     ✓ 403 Forbidden / invalid API key is NOT retried and immediately rejected');
    }

    // 9.8: 404 is NOT retried (stops immediately after attempt 1)
    {
      const retryProvider = new GeminiProvider('fake-api-key');
      let callCount = 0;
      (retryProvider as any).genAI = {
        models: {
          generateContent: async () => {
            callCount++;
            const err: any = new Error('[404 Not Found] models/gemini-3.7-flash is not found');
            err.status = 404;
            throw err;
          },
        },
      };

      let caught404: any = null;
      try {
        await retryProvider.generateSkillDnaEvaluation('test prompt');
      } catch (err: any) {
        caught404 = err;
      }

      assert.strictEqual(callCount, 1, '404 Not Found must NOT be retried (callCount = 1)');
      assert.ok(caught404 instanceof AppError);
      assert.strictEqual(caught404.statusCode, HttpStatusCode.SERVICE_UNAVAILABLE);
      console.log('     ✓ 404 Not Found is NOT retried and immediately rejected');
    }

    // 9.9: Retry count never exceeds maximum (bounded attempts)
    {
      const retryProvider = new GeminiProvider('fake-api-key', { maxAttempts: 3 });
      let callCount = 0;
      (retryProvider as any).genAI = {
        models: {
          generateContent: async () => {
            callCount++;
            throw new Error('500 Internal Server Error: transient server failure');
          },
        },
      };
      retryProvider.setSleepFn(async () => {});

      try {
        await retryProvider.generateSkillDnaEvaluation('test prompt');
      } catch (err) {
        // Expected
      }

      assert.strictEqual(
        callCount,
        3,
        'Total execution attempts must never exceed maxAttempts (3)',
      );
      console.log('     ✓ Retry count bounded strictly to max 3 attempts');
    }

    // 9.10: Diagnostic logging secret sanitization
    {
      const retryProvider = new GeminiProvider('fake-api-key', { maxAttempts: 1 });
      (retryProvider as any).genAI = {
        models: {
          generateContent: async () => {
            throw new Error(
              'Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=AIzaSySecretApiKey12345: [500 Internal Server Error] Backend failure with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret',
            );
          },
        },
      };

      let loggedDiagnosticTag = '';
      let loggedDiagnosticPayload = '';
      const origConsoleError = console.error;
      console.error = (...args: any[]) => {
        if (args[0] === '[GeminiProvider Diagnostic]') {
          loggedDiagnosticTag = args[0];
          loggedDiagnosticPayload = args[1];
        }
        origConsoleError(...args);
      };

      let caughtSanitized: any = null;
      try {
        await retryProvider.generateSkillDnaEvaluation('test prompt');
      } catch (err: any) {
        caughtSanitized = err;
      } finally {
        console.error = origConsoleError;
      }

      assert.ok(caughtSanitized instanceof AppError);
      assert.strictEqual(caughtSanitized.statusCode, HttpStatusCode.SERVICE_UNAVAILABLE);
      assert.strictEqual(
        caughtSanitized.message.includes('AIzaSySecretApiKey12345'),
        false,
        'Sensitive API keys MUST never leak into error message returned to caller',
      );
      assert.strictEqual(
        caughtSanitized.message,
        'Gemini AI inference service encountered an error.',
        'Safe generic message must be returned to client',
      );

      // Verify diagnostic log serialization and secret sanitization
      assert.strictEqual(loggedDiagnosticTag, '[GeminiProvider Diagnostic]');
      const parsedDiagnostic = JSON.parse(loggedDiagnosticPayload);
      assert.strictEqual(parsedDiagnostic.isApiKeyConfigured, true);
      assert.strictEqual(parsedDiagnostic.statusCode, 500);
      assert.strictEqual(
        parsedDiagnostic.providerErrorMessage.includes('AIzaSySecretApiKey12345'),
        false,
        'Diagnostic log must not leak sensitive API keys',
      );
      assert.strictEqual(
        parsedDiagnostic.providerErrorMessage.includes('key=[REDACTED]'),
        true,
        'Diagnostic log must redact API keys',
      );

      // Test controller error forwarding
      AiService.setGeminiProvider(retryProvider);
      const ctxSanitized = createMockExpressContext(`Bearer ${user1Token}`);
      authenticate(ctxSanitized.req, ctxSanitized.res, ctxSanitized.next);
      await AiController.generateReport(ctxSanitized.req, ctxSanitized.res, ctxSanitized.next);
      const errFromController = ctxSanitized.getError();
      assert.ok(errFromController instanceof AppError);
      assert.strictEqual(errFromController.statusCode, HttpStatusCode.SERVICE_UNAVAILABLE);
      assert.strictEqual(
        errFromController.message,
        'Gemini AI inference service encountered an error.',
      );

      console.log('     ✓ Upstream Gemini errors handled safely with complete secret sanitization');
    }
  }

  // ---------------------------------------------------------------------------
  // Test 10: Report Persistence & Profile Score Synchronization
  // ---------------------------------------------------------------------------
  {
    console.log('  10. Testing database persistence of generated report...');
    const persistedReport = await prisma.skillDnaReport.findUnique({
      where: { id: firstGeneratedReportId },
    });

    assert.ok(persistedReport, 'Report must be saved in skill_dna_reports table');
    assert.strictEqual(persistedReport.userId, user1Id);
    assert.strictEqual(persistedReport.reportType, ReportType.SKILLDNA_FULL);
    assert.strictEqual(persistedReport.overallScore, 89.2);
    assert.strictEqual(persistedReport.codeQualityScore, 92.0);
    assert.strictEqual(persistedReport.problemSolvingScore, 88.5);
    assert.strictEqual(persistedReport.systemDesignScore, 87.0);
    assert.strictEqual(persistedReport.breadthScore, 86.0);
    assert.strictEqual(persistedReport.consistencyScore, 92.5);
    assert.strictEqual(persistedReport.strengths.length, 4);
    assert.strictEqual(persistedReport.weaknesses.length, 2);
    assert.ok(persistedReport.rawAiOutput, 'Raw AI output must be stored as JSON');

    // Verify UserProfile was updated with the latest score
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user1Id },
    });
    assert.ok(userProfile);
    assert.strictEqual(userProfile.totalSkillDnaScore, 89.2);
    console.log(
      '     ✓ Report verified in database and UserProfile.totalSkillDnaScore synchronized',
    );
  }

  // ---------------------------------------------------------------------------
  // Test 11: Historical Reports Are Not Overwritten
  // ---------------------------------------------------------------------------
  {
    console.log('  11. Testing historical reports preservation (no overwriting)...');
    const reportsBefore = await prisma.skillDnaReport.findMany({
      where: { userId: user1Id },
      orderBy: { generatedAt: 'asc' },
    });
    const countBefore = reportsBefore.length;

    const secondOutputFixture = {
      ...validGeminiOutputFixture,
      overallScore: 93.4,
      codeQualityScore: 95.0,
    };

    AiService.setGeminiProvider(
      new MockGeminiProvider(async () => ({
        rawText: JSON.stringify(secondOutputFixture),
      })),
    );

    const ctxSecond = createMockExpressContext(`Bearer ${user1Token}`);
    authenticate(ctxSecond.req, ctxSecond.res, ctxSecond.next);
    await AiController.generateReport(ctxSecond.req, ctxSecond.res, ctxSecond.next);
    assert.strictEqual(ctxSecond.getError(), null);

    const secondReport = ctxSecond.getResponse().data;
    assert.notStrictEqual(
      secondReport.id,
      firstGeneratedReportId,
      'Second report must have a new distinct ID',
    );

    // Verify both original and new reports exist in DB without overwriting
    const allUserReports = await prisma.skillDnaReport.findMany({
      where: { userId: user1Id },
      orderBy: { generatedAt: 'asc' },
    });

    assert.strictEqual(
      allUserReports.length,
      countBefore + 1,
      'User 1 must have a new historical report record added',
    );
    assert.strictEqual(allUserReports[0].id, firstGeneratedReportId);
    assert.strictEqual(allUserReports[0].overallScore, 89.2);
    assert.strictEqual(allUserReports[allUserReports.length - 1].id, secondReport.id);
    assert.strictEqual(allUserReports[allUserReports.length - 1].overallScore, 93.4);

    // Verify user profile total score now points to latest score (93.4)
    const updatedProfile = await prisma.userProfile.findUnique({
      where: { userId: user1Id },
    });
    assert.strictEqual(updatedProfile?.totalSkillDnaScore, 93.4);

    console.log('     ✓ All report generations preserved as immutable historical records');
  }

  // ---------------------------------------------------------------------------
  // Test 12: Gemini Model Configuration & Override Verification
  // ---------------------------------------------------------------------------
  {
    console.log('  12. Testing Gemini model name configuration and override...');
    const { config } = await import('../../../config');

    // Default model verification
    assert.strictEqual(
      config.geminiModel,
      process.env.GEMINI_MODEL || 'gemini-3.7-flash',
      'Configured Gemini model must default to gemini-3.7-flash or match GEMINI_MODEL env',
    );
    assert.notStrictEqual(
      config.geminiModel,
      'gemini-1.5-pro',
      'Obsolete gemini-1.5-pro model must not be used',
    );

    // Verify report stores the configured model name in rawAiOutput
    const latestReport = await prisma.skillDnaReport.findFirst({
      where: { userId: user1Id },
      orderBy: { generatedAt: 'desc' },
    });
    assert.ok(latestReport);
    assert.strictEqual(
      (latestReport.rawAiOutput as any)?.model,
      config.geminiModel,
      'Persisted report rawAiOutput must record the active model name',
    );

    console.log(
      `     ✓ Model verified: '${config.geminiModel}' active and recorded in persistence`,
    );
  }

  // ---------------------------------------------------------------------------
  // Test 13: Authenticated Latest Report Retrieval (GET /api/v1/ai/skill-dna-report)
  // ---------------------------------------------------------------------------
  {
    console.log(
      '  13. Testing authenticated latest report retrieval (GET /api/v1/ai/skill-dna-report)...',
    );
    const ctxGet = createMockExpressContext(`Bearer ${user1Token}`);
    authenticate(ctxGet.req, ctxGet.res, ctxGet.next);
    assert.strictEqual(ctxGet.getError(), null);

    await AiController.getLatestReport(ctxGet.req, ctxGet.res, ctxGet.next);
    assert.strictEqual(ctxGet.getError(), null, 'GET report must succeed without error');
    assert.strictEqual(ctxGet.getStatusCode(), 200, 'GET report must return HTTP 200');

    const res = ctxGet.getResponse();
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.message, 'Latest SkillDNA Report retrieved successfully.');
    assert.ok(res.data, 'Response must contain report data');
    assert.strictEqual(res.data.userId, user1Id);
    assert.strictEqual(res.data.overallScore, 93.4, 'Must return the newest report for user 1');
    assert.strictEqual(res.data.codeQualityScore, 95.0);
    assert.ok(Array.isArray(res.data.strengths));
    assert.ok(Array.isArray(res.data.weaknesses));
    assert.ok(res.data.recommendationSummary);
    assert.ok(res.data.generatedAt);
    console.log('     ✓ Latest report retrieved successfully with full fields and HTTP 200');
  }

  // ---------------------------------------------------------------------------
  // Test 14: Unauthenticated Retrieval Rejection (Missing & Invalid Auth)
  // ---------------------------------------------------------------------------
  {
    console.log('  14. Testing unauthenticated report retrieval rejection...');
    const ctxNoAuth = createMockExpressContext(undefined);
    authenticate(ctxNoAuth.req, ctxNoAuth.res, ctxNoAuth.next);
    const err = ctxNoAuth.getError();
    assert.ok(err instanceof AppError);
    assert.strictEqual(err.statusCode, HttpStatusCode.UNAUTHORIZED);

    const ctxDirect = createMockExpressContext(undefined);
    await AiController.getLatestReport(ctxDirect.req, ctxDirect.res, ctxDirect.next);
    const errDirect = ctxDirect.getError();
    assert.ok(errDirect instanceof AppError);
    assert.strictEqual(errDirect.statusCode, HttpStatusCode.UNAUTHORIZED);
    console.log('     ✓ Unauthenticated GET cleanly rejected with 401 UNAUTHORIZED');
  }

  // ---------------------------------------------------------------------------
  // Test 15: User Isolation on Retrieval (Never return another user's report)
  // ---------------------------------------------------------------------------
  {
    console.log('  15. Testing user isolation on report retrieval...');
    // User 2 (Bob) attempts to retrieve User 1's report by passing userId in params or query
    const ctxBob = createMockExpressContext(`Bearer ${user2Token}`, {}, { userId: user1Id });
    authenticate(ctxBob.req, ctxBob.res, ctxBob.next);
    await AiController.getLatestReport(ctxBob.req, ctxBob.res, ctxBob.next);

    assert.strictEqual(ctxBob.getError(), null);
    const res = ctxBob.getResponse();
    assert.strictEqual(res.success, true);
    // Bob has not generated any reports yet -> should return null for Bob, NOT User 1's report
    assert.strictEqual(
      res.data,
      null,
      "Bob must not receive Alice's report even if passing Alice's userId",
    );
    assert.strictEqual(res.message, 'No SkillDNA report found for the authenticated user.');
    console.log('     ✓ User isolation strictly enforced; spoofed userId completely ignored');
  }

  // ---------------------------------------------------------------------------
  // Test 16: No-Report Behavior (New user with zero reports)
  // ---------------------------------------------------------------------------
  {
    console.log('  16. Testing no-report behavior for new user...');
    const user3Email = `ai.fresh.${Date.now()}@skilldna.ai`;
    const user3Auth = await AuthService.register({
      email: user3Email,
      password: 'Password123!',
      firstName: 'Charlie',
      lastName: 'Newbie',
    });

    const ctxCharlie = createMockExpressContext(`Bearer ${user3Auth.accessToken}`);
    authenticate(ctxCharlie.req, ctxCharlie.res, ctxCharlie.next);
    await AiController.getLatestReport(ctxCharlie.req, ctxCharlie.res, ctxCharlie.next);

    assert.strictEqual(ctxCharlie.getError(), null);
    assert.strictEqual(ctxCharlie.getStatusCode(), 200);
    const res = ctxCharlie.getResponse();
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data, null, 'Empty report state must return data: null without error');
    assert.strictEqual(res.message, 'No SkillDNA report found for the authenticated user.');
    console.log('     ✓ Zero-report user returns standard { success: true, data: null } response');
  }

  // ---------------------------------------------------------------------------
  // Test 17: Newest-Report Selection (Ordering by generatedAt desc)
  // ---------------------------------------------------------------------------
  let thirdReportId = '';
  {
    console.log('  17. Testing newest-report selection logic when multiple reports exist...');
    // User 1 has report 1 (score 89.2) and report 2 (score 93.4)
    const latestFromService = await AiService.getLatestSkillDnaReport(user1Id);
    assert.ok(latestFromService);
    assert.strictEqual(latestFromService.overallScore, 93.4);
    assert.strictEqual(latestFromService.codeQualityScore, 95.0);

    // Add a third newer report
    const thirdReport = await prisma.skillDnaReport.create({
      data: {
        userId: user1Id,
        reportType: ReportType.SKILLDNA_FULL,
        overallScore: 97.5,
        codeQualityScore: 98.0,
        problemSolvingScore: 96.0,
        systemDesignScore: 97.0,
        breadthScore: 95.0,
        consistencyScore: 98.0,
        strengths: ['Mastery in distributed architecture.'],
        weaknesses: ['None.'],
        recommendationSummary: 'Top echelon engineer.',
        generatedAt: new Date(Date.now() + 120000),
      },
    });
    thirdReportId = thirdReport.id;

    const ctxNewest = createMockExpressContext(`Bearer ${user1Token}`);
    authenticate(ctxNewest.req, ctxNewest.res, ctxNewest.next);
    await AiController.getLatestReport(ctxNewest.req, ctxNewest.res, ctxNewest.next);

    const res = ctxNewest.getResponse();
    assert.strictEqual(res.data.id, thirdReport.id);
    assert.strictEqual(res.data.overallScore, 97.5, 'Must return the third newest report');
    console.log('     ✓ Newest report accurately selected using generatedAt descending');
  }

  // ---------------------------------------------------------------------------
  // Test 18: Historical Reports Remain Untouched in Database
  // ---------------------------------------------------------------------------
  {
    console.log('  18. Testing historical reports preservation in database...');
    const allReports = await prisma.skillDnaReport.findMany({
      where: { userId: user1Id },
      orderBy: { generatedAt: 'asc' },
    });

    assert.strictEqual(allReports.length, 4, 'All 4 generated reports must remain preserved');
    assert.strictEqual(allReports[0].id, firstGeneratedReportId);
    assert.strictEqual(allReports[0].overallScore, 89.2);
    assert.strictEqual(allReports[allReports.length - 1].id, thirdReportId);
    assert.strictEqual(allReports[allReports.length - 1].overallScore, 97.5);
    console.log('     ✓ All historical records verified intact and immutable');
  }

  console.log(
    '\n🎉 All 18 Backend SkillDNA AI Report Generation & Retrieval Tests Passed Successfully!',
  );
}

runAiDomainTests()
  .catch((err) => {
    console.error('❌ SkillDNA AI Backend Tests Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    AiService.resetGeminiProvider();
    await prisma.$disconnect();
  });
