import bcrypt from 'bcrypt';

import {
  PrismaClient,
  UserRole,
  AccountStatus,
  AuthProvider,
  SkillCategory,
  ProficiencyLevel,
  ProjectCategory,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SkillDNA AI Database Seeding...');

  // ============================================================
  // CLEAN DATABASE
  // ============================================================

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aiChatHistory.deleteMany();
  await prisma.portfolioAnalysis.deleteMany();
  await prisma.resumeAnalysis.deleteMany();
  await prisma.skillVerification.deleteMany();
  await prisma.careerReadiness.deleteMany();
  await prisma.skillDnaReport.deleteMany();
  await prisma.codingStat.deleteMany();
  await prisma.gitHubStat.deleteMany();
  await prisma.platformIntegration.deleteMany();
  await prisma.hackathon.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.projectSkill.deleteMany();
  await prisma.project.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.education.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned database tables.');

  // ============================================================
  // SEED MASTER SKILLS
  // ============================================================

  const skillsData = [
    {
      name: 'TypeScript',
      slug: 'typescript',
      category: SkillCategory.LANGUAGES,
    },
    {
      name: 'Node.js',
      slug: 'nodejs',
      category: SkillCategory.BACKEND,
    },
    {
      name: 'React',
      slug: 'react',
      category: SkillCategory.FRONTEND,
    },
    {
      name: 'Next.js',
      slug: 'nextjs',
      category: SkillCategory.FRONTEND,
    },
    {
      name: 'PostgreSQL',
      slug: 'postgresql',
      category: SkillCategory.DATABASE,
    },
    {
      name: 'Prisma ORM',
      slug: 'prisma-orm',
      category: SkillCategory.DATABASE,
    },
    {
      name: 'Docker',
      slug: 'docker',
      category: SkillCategory.DEVOPS,
    },
    {
      name: 'Python',
      slug: 'python',
      category: SkillCategory.LANGUAGES,
    },
    {
      name: 'Gemini AI API',
      slug: 'gemini-ai-api',
      category: SkillCategory.AI_ML,
    },
    {
      name: 'Tailwind CSS',
      slug: 'tailwind-css',
      category: SkillCategory.FRONTEND,
    },
  ];

  const createdSkills: Record<string, string> = {};

  for (const skillData of skillsData) {
    const skill = await prisma.skill.create({
      data: skillData,
    });

    createdSkills[skillData.slug] = skill.id;
  }

  console.log(`✅ Seeded ${Object.keys(createdSkills).length} Master Skills.`);

  // ============================================================
  // PASSWORD HASH
  // ============================================================

  // Both test users use:
  // password123

  const passwordHash = await bcrypt.hash('password123', 12);

  // ============================================================
  // SEED STUDENT USER
  // ============================================================

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@skilldna.ai',
      passwordHash,

      firstName: 'Parmesh',
      lastName: 'KS',

      role: UserRole.STUDENT,
      status: AccountStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
      emailVerified: true,

      headline: 'Full Stack AI Engineer & Open Source Enthusiast',

      bio: 'Building SkillDNA AI — Your Living Technical Identity.',

      location: 'Tamil Nadu, India',

      githubUsername: 'parmeshks',
      leetcodeUsername: 'parmeshks',

      profile: {
        create: {
          summary:
            'Motivated software developer passionate about TypeScript, Node.js, AI systems, and microservice architectures.',

          targetRole: 'Full Stack Engineer',

          yearsOfExperience: 2,

          expectedSalary: 1200000,

          totalSkillDnaScore: 88.5,

          totalReadinessScore: 92.0,
        },
      },
    },
  });

  // ============================================================
  // SEED RECRUITER USER
  // ============================================================

  await prisma.user.create({
    data: {
      email: 'recruiter@techcorp.com',
      passwordHash,

      firstName: 'Sarah',
      lastName: 'Conner',

      role: UserRole.RECRUITER,
      status: AccountStatus.ACTIVE,
      provider: AuthProvider.LOCAL,

      headline: 'Senior Technical Recruiter at TechCorp',

      location: 'San Francisco, CA',
    },
  });

  console.log('✅ Seeded Users (Student & Recruiter).');

  // ============================================================
  // SEED USER SKILLS
  // ============================================================

  await prisma.userSkill.createMany({
    data: [
      {
        userId: studentUser.id,
        skillId: createdSkills['typescript'],
        proficiency: ProficiencyLevel.EXPERT,
        verified: true,
        verifiedScore: 95.0,
        selfRating: 5,
        yearsOfExperience: 2.5,
      },
      {
        userId: studentUser.id,
        skillId: createdSkills['nodejs'],
        proficiency: ProficiencyLevel.ADVANCED,
        verified: true,
        verifiedScore: 90.0,
        selfRating: 4,
        yearsOfExperience: 2.0,
      },
      {
        userId: studentUser.id,
        skillId: createdSkills['react'],
        proficiency: ProficiencyLevel.ADVANCED,
        verified: true,
        verifiedScore: 88.0,
        selfRating: 4,
        yearsOfExperience: 2.0,
      },
      {
        userId: studentUser.id,
        skillId: createdSkills['postgresql'],
        proficiency: ProficiencyLevel.INTERMEDIATE,
        verified: true,
        verifiedScore: 82.0,
        selfRating: 3,
        yearsOfExperience: 1.5,
      },
    ],
  });

  console.log('✅ Seeded Student Skills.');

  // ============================================================
  // SEED PROJECT
  // ============================================================

  await prisma.project.create({
    data: {
      userId: studentUser.id,

      title: 'SkillDNA AI Platform',

      slug: 'skilldna-ai-platform',

      description:
        'AI-powered SaaS monorepo platform generating dynamic technical identity profiles.',

      category: ProjectCategory.WEB_APP,

      repoUrl: 'https://github.com/parmeshks/SkillDNA-AI',

      liveUrl: 'https://skilldna.ai',

      techStack: ['TypeScript', 'Next.js', 'Express', 'PostgreSQL', 'Prisma', 'Gemini AI'],

      starsCount: 42,

      forksCount: 12,

      linesOfCode: 15400,

      status: 'ACTIVE',

      projectSkills: {
        create: [
          {
            skillId: createdSkills['typescript'],
          },
          {
            skillId: createdSkills['nodejs'],
          },
          {
            skillId: createdSkills['nextjs'],
          },
        ],
      },
    },
  });

  console.log('✅ Seeded Project.');

  // ============================================================
  // SEED SKILLDNA REPORT
  // ============================================================

  await prisma.skillDnaReport.create({
    data: {
      userId: studentUser.id,

      overallScore: 88.5,

      codeQualityScore: 91.0,

      problemSolvingScore: 86.0,

      systemDesignScore: 89.0,

      breadthScore: 85.0,

      consistencyScore: 92.0,

      strengths: [
        'Strict TypeScript Architecture',
        'Clean Monorepo Modularization',
        'Comprehensive Documentation',
      ],

      weaknesses: ['Advanced Kubernetes Orchestration', 'GraphQL Query Optimization'],

      recommendationSummary:
        'Candidate exhibits top 5% architectural maturity for 2 years of experience. Highly recommended for Senior Full Stack roles.',
    },
  });

  console.log('✅ Seeded SkillDNA Report.');

  console.log('🌱 SkillDNA AI Database Seeding Complete!');
}

// ============================================================
// EXECUTION
// ============================================================

main()
  .catch((error) => {
    console.error('❌ Database Seeding Failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
