import { prisma } from '@skilldna/database';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  headline?: string;
  location?: string;
  websiteUrl?: string;
  githubUsername?: string;
  leetcodeUsername?: string;
  hackerrankUsername?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  summary?: string;
  targetRole?: string;
  yearsOfExperience?: number;
  expectedSalary?: number;
  availabilityStatus?: string;
}

export class UserService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        userSkills: {
          include: {
            skill: true,
          },
        },
        projects: true,
        educations: true,
        certifications: true,
      },
    });

    if (!user) {
      throw new AppError(
        'User profile not found.',
        HttpStatusCode.NOT_FOUND,
        ApiErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    return {
      id: user.id,
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      provider: user.provider,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      headline: user.headline,
      location: user.location,
      websiteUrl: user.websiteUrl,
      githubUsername: user.githubUsername,
      leetcodeUsername: user.leetcodeUsername,
      hackerrankUsername: user.hackerrankUsername,
      linkedinUrl: user.linkedinUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile || {
        id: '',
        userId: user.id,
        summary: null,
        targetRole: null,
        yearsOfExperience: 0,
        expectedSalary: null,
        availabilityStatus: 'OPEN_TO_WORK',
        totalSkillDnaScore: 0.0,
        totalReadinessScore: 0.0,
      },
      skills: user.userSkills || [],
      projects: user.projects || [],
      educations: user.educations || [],
      certifications: user.certifications || [],
    };
  }

  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new AppError(
        'User profile not found for update.',
        HttpStatusCode.NOT_FOUND,
        ApiErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    const {
      summary,
      targetRole,
      yearsOfExperience,
      expectedSalary,
      availabilityStatus,
      ...userFields
    } = data;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...userFields,
        profile: {
          upsert: {
            create: {
              summary: summary || null,
              targetRole: targetRole || null,
              yearsOfExperience: yearsOfExperience || 0,
              expectedSalary: expectedSalary || null,
              availabilityStatus: availabilityStatus || 'OPEN_TO_WORK',
            },
            update: {
              ...(summary !== undefined && { summary }),
              ...(targetRole !== undefined && { targetRole }),
              ...(yearsOfExperience !== undefined && { yearsOfExperience }),
              ...(expectedSalary !== undefined && { expectedSalary }),
              ...(availabilityStatus !== undefined && { availabilityStatus }),
            },
          },
        },
      },
      include: {
        profile: true,
        userSkills: {
          include: {
            skill: true,
          },
        },
        projects: true,
        educations: true,
        certifications: true,
      },
    });

    return {
      id: updatedUser.id,
      userId: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      status: updatedUser.status,
      avatarUrl: updatedUser.avatarUrl,
      bio: updatedUser.bio,
      headline: updatedUser.headline,
      location: updatedUser.location,
      websiteUrl: updatedUser.websiteUrl,
      githubUsername: updatedUser.githubUsername,
      leetcodeUsername: updatedUser.leetcodeUsername,
      hackerrankUsername: updatedUser.hackerrankUsername,
      linkedinUrl: updatedUser.linkedinUrl,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      profile: updatedUser.profile,
      skills: updatedUser.userSkills || [],
      projects: updatedUser.projects || [],
      educations: updatedUser.educations || [],
      certifications: updatedUser.certifications || [],
    };
  }

  static async getUserById(id: string) {
    return this.getProfile(id);
  }
}
