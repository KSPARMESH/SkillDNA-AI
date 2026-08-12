import { PlatformType } from '@skilldna/shared';

export const INTEGRATION_CONSTANTS = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_BACKOFF_BASE_MS: 1000,
  DEFAULT_SYNC_BATCH_SIZE: 50,
  DEFAULT_CRON_SCHEDULE: '0 */6 * * *',
  RATE_LIMIT_COOLDOWN_MS: 15 * 60 * 1000,

  SUPPORTED_PLATFORMS: Object.values(PlatformType),

  OAUTH_ENDPOINTS: {
    [PlatformType.GITHUB]: {
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      scope: 'read:user repo',
    },
    [PlatformType.LINKEDIN]: {
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scope: 'openid profile email',
    },
  } as Record<string, { authUrl: string; tokenUrl: string; scope: string } | undefined>,

  API_ENDPOINTS: {
    GITHUB: 'https://api.github.com',
    LEETCODE: 'https://leetcode.com/graphql',
    HACKERRANK: 'https://www.hackerrank.com/rest/hackers',
    CODEFORCES: 'https://codeforces.com/api',
    ATCODER: 'https://kenkoooo.com/atcoder/atcoder-api/v3',
    KAGGLE: 'https://www.kaggle.com/api/v1',
    LINKEDIN: 'https://api.linkedin.com/v2',
    DEVPOST: 'https://devpost.com/api',
    MEDIUM: 'https://api.medium.com/v1',
    MEDIUM_RSS: 'https://medium.com/feed',
    STACKOVERFLOW: 'https://api.stackexchange.com/2.3',
  },
};
