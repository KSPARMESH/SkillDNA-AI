import { PlatformType } from '@skilldna/shared';

export type SyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'FAILED' | 'RATE_LIMITED';

export type SyncMode = 'FULL' | 'INCREMENTAL';

export type WebhookSource = 'GITHUB' | 'MEDIUM' | 'DEVPOST' | 'GENERIC';

export interface NormalizedGitHubData {
  publicRepos: number;
  totalStars: number;
  totalForks: number;
  totalCommits: number;
  PRsCreated: number;
  issuesSolved: number;
  topLanguages: Record<string, number>;
  contributionGraph?: Record<string, any>;
  recentProjects?: Array<{
    name: string;
    description?: string;
    url: string;
    stars: number;
    forks: number;
    language?: string;
  }>;
}

export interface NormalizedCodingData {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking?: number | null;
  contestRating?: number | null;
  badgesCount: number;
  recentSubmissionsCount?: number;
}

export interface NormalizedLinkedInData {
  headline?: string;
  location?: string;
  summary?: string;
  connectionsCount?: number;
  profileUrl?: string;
  positions?: Array<{ title: string; company: string; startDate?: string }>;
}

export interface NormalizedMediumData {
  totalArticles: number;
  totalClaps?: number;
  followersCount?: number;
  articles?: Array<{
    title: string;
    link: string;
    pubDate: string;
  }>;
}

export interface NormalizedStackOverflowData {
  reputation: number;
  badgeCounts: {
    gold: number;
    silver: number;
    bronze: number;
  };
  answersCount: number;
  questionsCount: number;
}

export interface NormalizedDevpostData {
  projectsCount: number;
  hackathonsAttended: number;
  likesReceived?: number;
  projects?: Array<{
    title: string;
    tagline?: string;
    url: string;
  }>;
}

export interface NormalizedKaggleData {
  tier?: string;
  competitionsCount: number;
  datasetsCount: number;
  notebooksCount: number;
  medalsCount: {
    gold: number;
    silver: number;
    bronze: number;
  };
}

export interface NormalizedPlatformResult {
  platform: PlatformType | string;
  username: string;
  githubStats?: NormalizedGitHubData;
  codingStats?: NormalizedCodingData;
  linkedInStats?: NormalizedLinkedInData;
  mediumStats?: NormalizedMediumData;
  stackOverflowStats?: NormalizedStackOverflowData;
  devpostStats?: NormalizedDevpostData;
  kaggleStats?: NormalizedKaggleData;
  limitation?: string;
  rawMetadata?: Record<string, any>;
}

export interface PlatformConnectionPayload {
  platform: PlatformType;
  username: string;
  accessToken?: string;
  refreshToken?: string;
  metadata?: Record<string, any>;
}

export interface SyncRequestPayload {
  platform: PlatformType;
  mode?: SyncMode;
  force?: boolean;
}

export interface WebhookPayload {
  platform: PlatformType;
  event: string;
  payload: Record<string, any>;
  signature?: string;
}
