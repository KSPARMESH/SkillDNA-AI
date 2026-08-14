import { prisma } from '@skilldna/database';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';
import {
  SkillDnaContext,
  UserProfileContext,
  UserSkillContext,
  ProjectContext,
  GitHubStatContext,
  CodingStatContext,
  PlatformIntegrationContext,
  CertificationContext,
  HackathonContext,
  EducationContext,
  SkillVerificationContext,
} from '../types/ai.types';

export class AiContextBuilder {
  static async buildUserSkillDnaContext(userId: string): Promise<SkillDnaContext> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        userSkills: {
          include: {
            skill: true,
          },
        },
        projects: {
          include: {
            projectSkills: {
              include: {
                skill: true,
              },
            },
          },
        },
        gitHubStats: true,
        codingStats: true,
        integrations: true,
        certifications: true,
        hackathons: true,
        educations: true,
        skillVerifications: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(
        'User profile not found for AI SkillDNA report generation.',
        HttpStatusCode.NOT_FOUND,
        ApiErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    // 1. Profile Context
    const profileContext: UserProfileContext = {
      summary: user.profile?.summary ?? null,
      targetRole: user.profile?.targetRole ?? null,
      yearsOfExperience: user.profile?.yearsOfExperience ?? 0,
      expectedSalary: user.profile?.expectedSalary ?? null,
      availabilityStatus: user.profile?.availabilityStatus ?? null,
    };

    // 2. User Skills Context
    const skillsContext: UserSkillContext[] = (user.userSkills || []).map((us) => ({
      name: us.skill?.name || 'Unknown Skill',
      category: us.skill?.category || 'OTHER',
      proficiency: us.proficiency,
      verified: us.verified,
      verifiedScore: us.verifiedScore,
      selfRating: us.selfRating,
      yearsOfExperience: us.yearsOfExperience,
    }));

    // 3. Projects Context
    const projectsContext: ProjectContext[] = (user.projects || []).map((proj) => ({
      title: proj.title,
      category: proj.category,
      description: proj.description,
      techStack: proj.techStack || [],
      starsCount: proj.starsCount,
      forksCount: proj.forksCount,
      linesOfCode: proj.linesOfCode,
      status: proj.status,
      skills: (proj.projectSkills || []).map((ps) => ps.skill?.name).filter(Boolean),
    }));

    // 4. GitHub Stats Context
    const rawGithubStat =
      user.gitHubStats && user.gitHubStats.length > 0 ? user.gitHubStats[0] : null;
    const githubStatsContext: GitHubStatContext | null = rawGithubStat
      ? {
          publicRepos: rawGithubStat.publicRepos,
          totalStars: rawGithubStat.totalStars,
          totalForks: rawGithubStat.totalForks,
          totalCommits: rawGithubStat.totalCommits,
          PRsCreated: rawGithubStat.PRsCreated,
          issuesSolved: rawGithubStat.issuesSolved,
          topLanguages: (rawGithubStat.topLanguages as Record<string, any>) || null,
          contributionGraph: (rawGithubStat.contributionGraph as Record<string, any>) || null,
          syncedAt: rawGithubStat.syncedAt?.toISOString() || null,
        }
      : null;

    // 5. Coding Stats Context (e.g. LeetCode, Codeforces, AtCoder, HackerRank)
    const codingStatsContext: CodingStatContext[] = (user.codingStats || []).map((stat) => ({
      platform: stat.platform,
      totalSolved: stat.totalSolved,
      easySolved: stat.easySolved,
      mediumSolved: stat.mediumSolved,
      hardSolved: stat.hardSolved,
      ranking: stat.ranking,
      contestRating: stat.contestRating,
      badgesCount: stat.badgesCount,
      syncedAt: stat.syncedAt?.toISOString() || null,
    }));

    // 6. Connected Platforms (Strictly omitting access/refresh tokens!)
    const connectedPlatformsContext: PlatformIntegrationContext[] = (user.integrations || []).map(
      (intg) => ({
        platform: intg.platform,
        username: intg.username,
        isConnected: intg.isConnected,
        lastSyncedAt: intg.lastSyncedAt?.toISOString() || null,
        syncStatus: intg.syncStatus,
      }),
    );

    // 7. Certifications Context
    const certificationsContext: CertificationContext[] = (user.certifications || []).map(
      (cert) => ({
        title: cert.title,
        issuingOrganization: cert.issuingOrganization,
        issueDate: cert.issueDate?.toISOString() || '',
        expiryDate: cert.expiryDate?.toISOString() || null,
        isVerified: cert.isVerified,
        status: cert.status,
      }),
    );

    // 8. Hackathons Context
    const hackathonsContext: HackathonContext[] = (user.hackathons || []).map((hack) => ({
      name: hack.name,
      projectTitle: hack.projectTitle,
      role: hack.role,
      description: hack.description,
      position: hack.position,
      prizeAmount: hack.prizeAmount,
      eventDate: hack.eventDate?.toISOString() || '',
      isVerified: hack.isVerified,
    }));

    // 9. Educations Context
    const educationsContext: EducationContext[] = (user.educations || []).map((edu) => ({
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startYear: edu.startYear,
      endYear: edu.endYear,
      grade: edu.grade,
      isCurrent: edu.isCurrent,
    }));

    // 10. Verified Skills Context
    const verifiedSkillsContext: SkillVerificationContext[] = (user.skillVerifications || []).map(
      (ver) => ({
        skillName: ver.skill?.name || 'Unknown Skill',
        verificationMethod: ver.verificationMethod,
        verificationScore: ver.verificationScore,
        proofUrl: ver.proofUrl,
        verifiedAt: ver.verifiedAt?.toISOString() || '',
      }),
    );

    // Evidence Summary (Computed deterministically from real persisted records)
    const totalCodingProblemsSolved = codingStatsContext.reduce(
      (sum, item) => sum + item.totalSolved,
      0,
    );
    const totalGithubCommits = githubStatsContext?.totalCommits ?? 0;
    const totalVerifiedSkills = skillsContext.filter((s) => s.verified).length;

    return {
      userId: user.id,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        headline: user.headline,
        bio: user.bio,
        location: user.location,
        websiteUrl: user.websiteUrl,
        githubUsername: user.githubUsername,
        leetcodeUsername: user.leetcodeUsername,
        hackerrankUsername: user.hackerrankUsername,
        linkedinUrl: user.linkedinUrl,
        createdAt: user.createdAt.toISOString(),
      },
      profile: profileContext,
      skills: skillsContext,
      projects: projectsContext,
      githubStats: githubStatsContext,
      codingStats: codingStatsContext,
      connectedPlatforms: connectedPlatformsContext,
      certifications: certificationsContext,
      hackathons: hackathonsContext,
      education: educationsContext,
      verifiedSkills: verifiedSkillsContext,
      evidenceSummary: {
        totalProjects: projectsContext.length,
        totalSkills: skillsContext.length,
        totalVerifiedSkills,
        totalCodingProblemsSolved,
        totalGithubCommits,
        totalCertifications: certificationsContext.length,
        totalHackathons: hackathonsContext.length,
        hasGithubData: !!githubStatsContext,
        hasCodingStats: codingStatsContext.length > 0,
      },
    };
  }
}
