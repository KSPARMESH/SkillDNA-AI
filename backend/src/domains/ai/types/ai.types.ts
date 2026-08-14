import {
  PlatformType,
  DegreeType,
  ProficiencyLevel,
  ProjectCategory,
  HackathonRole,
  CertificationStatus,
  VerificationMethod,
} from '@prisma/client';

export interface UserProfileContext {
  summary: string | null;
  targetRole: string | null;
  yearsOfExperience: number;
  expectedSalary: number | null;
  availabilityStatus: string | null;
}

export interface UserSkillContext {
  name: string;
  category: string;
  proficiency: ProficiencyLevel | string;
  verified: boolean;
  verifiedScore: number;
  selfRating: number;
  yearsOfExperience: number;
}

export interface ProjectContext {
  title: string;
  category: ProjectCategory | string;
  description: string;
  techStack: string[];
  starsCount: number;
  forksCount: number;
  linesOfCode: number;
  status: string;
  skills: string[];
}

export interface GitHubStatContext {
  publicRepos: number;
  totalStars: number;
  totalForks: number;
  totalCommits: number;
  PRsCreated: number;
  issuesSolved: number;
  topLanguages: Record<string, any> | null;
  contributionGraph: Record<string, any> | null;
  syncedAt: string | null;
}

export interface CodingStatContext {
  platform: PlatformType | string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number | null;
  contestRating: number | null;
  badgesCount: number;
  syncedAt: string | null;
}

export interface PlatformIntegrationContext {
  platform: PlatformType | string;
  username: string;
  isConnected: boolean;
  lastSyncedAt: string | null;
  syncStatus: string;
}

export interface CertificationContext {
  title: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string | null;
  isVerified: boolean;
  status: CertificationStatus | string;
}

export interface HackathonContext {
  name: string;
  projectTitle: string;
  role: HackathonRole | string;
  description: string;
  position: string | null;
  prizeAmount: string | null;
  eventDate: string;
  isVerified: boolean;
}

export interface EducationContext {
  institution: string;
  degree: DegreeType | string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number | null;
  grade: string | null;
  isCurrent: boolean;
}

export interface SkillVerificationContext {
  skillName: string;
  verificationMethod: VerificationMethod | string;
  verificationScore: number;
  proofUrl: string | null;
  verifiedAt: string;
}

export interface SkillDnaContext {
  userId: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
    headline: string | null;
    bio: string | null;
    location: string | null;
    websiteUrl: string | null;
    githubUsername: string | null;
    leetcodeUsername: string | null;
    hackerrankUsername: string | null;
    linkedinUrl: string | null;
    createdAt: string;
  };
  profile: UserProfileContext;
  skills: UserSkillContext[];
  projects: ProjectContext[];
  githubStats: GitHubStatContext | null;
  codingStats: CodingStatContext[];
  connectedPlatforms: PlatformIntegrationContext[];
  certifications: CertificationContext[];
  hackathons: HackathonContext[];
  education: EducationContext[];
  verifiedSkills: SkillVerificationContext[];
  evidenceSummary: {
    totalProjects: number;
    totalSkills: number;
    totalVerifiedSkills: number;
    totalCodingProblemsSolved: number;
    totalGithubCommits: number;
    totalCertifications: number;
    totalHackathons: number;
    hasGithubData: boolean;
    hasCodingStats: boolean;
  };
}

export interface GeminiSkillDnaReportOutput {
  overallScore: number;
  codeQualityScore: number;
  problemSolvingScore: number;
  systemDesignScore: number;
  breadthScore: number;
  consistencyScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendationSummary: string;
  rawAiOutput?: any;
}
