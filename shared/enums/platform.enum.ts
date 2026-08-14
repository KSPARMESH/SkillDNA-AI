export enum PlatformType {
  GITHUB = 'GITHUB',
  LEETCODE = 'LEETCODE',
  HACKERRANK = 'HACKERRANK',
  LINKEDIN = 'LINKEDIN',
  KAGGLE = 'KAGGLE',
  CODECHEF = 'CODECHEF',
  CODEFORCES = 'CODEFORCES',
  ATCODER = 'ATCODER',
  DEVPOST = 'DEVPOST',
  MEDIUM = 'MEDIUM',
  STACKOVERFLOW = 'STACKOVERFLOW',
}

export const PLATFORM_DISPLAY_NAMES: Record<PlatformType, string> = {
  [PlatformType.GITHUB]: 'GitHub',
  [PlatformType.LEETCODE]: 'LeetCode',
  [PlatformType.HACKERRANK]: 'HackerRank',
  [PlatformType.LINKEDIN]: 'LinkedIn',
  [PlatformType.KAGGLE]: 'Kaggle',
  [PlatformType.CODECHEF]: 'CodeChef',
  [PlatformType.CODEFORCES]: 'Codeforces',
  [PlatformType.ATCODER]: 'AtCoder',
  [PlatformType.DEVPOST]: 'Devpost',
  [PlatformType.MEDIUM]: 'Medium',
  [PlatformType.STACKOVERFLOW]: 'Stack Overflow',
};

const PLATFORM_ALIAS_MAP: Record<string, PlatformType> = {
  // Direct enum values (uppercase)
  GITHUB: PlatformType.GITHUB,
  LEETCODE: PlatformType.LEETCODE,
  HACKERRANK: PlatformType.HACKERRANK,
  LINKEDIN: PlatformType.LINKEDIN,
  KAGGLE: PlatformType.KAGGLE,
  CODECHEF: PlatformType.CODECHEF,
  CODEFORCES: PlatformType.CODEFORCES,
  ATCODER: PlatformType.ATCODER,
  DEVPOST: PlatformType.DEVPOST,
  MEDIUM: PlatformType.MEDIUM,
  STACKOVERFLOW: PlatformType.STACKOVERFLOW,

  // Display labels & lowercase / mixed-case aliases
  atcoder: PlatformType.ATCODER,
  github: PlatformType.GITHUB,
  leetcode: PlatformType.LEETCODE,
  hackerrank: PlatformType.HACKERRANK,
  linkedin: PlatformType.LINKEDIN,
  kaggle: PlatformType.KAGGLE,
  codechef: PlatformType.CODECHEF,
  codeforces: PlatformType.CODEFORCES,
  devpost: PlatformType.DEVPOST,
  medium: PlatformType.MEDIUM,
  stackoverflow: PlatformType.STACKOVERFLOW,
  'stack overflow': PlatformType.STACKOVERFLOW,
  'stack-overflow': PlatformType.STACKOVERFLOW,
  stack_overflow: PlatformType.STACKOVERFLOW,
};

export function normalizePlatformType(input?: string | PlatformType | null): PlatformType | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct match in alias map
  if (PLATFORM_ALIAS_MAP[trimmed]) {
    return PLATFORM_ALIAS_MAP[trimmed];
  }

  // Uppercase direct match
  const upper = trimmed.toUpperCase();
  if (PLATFORM_ALIAS_MAP[upper]) {
    return PLATFORM_ALIAS_MAP[upper];
  }

  // Normalized alphanumeric match (lowercase without spaces/hyphens/underscores)
  const sanitized = trimmed.toLowerCase().replace(/[\s\-_]+/g, '');
  if (PLATFORM_ALIAS_MAP[sanitized]) {
    return PLATFORM_ALIAS_MAP[sanitized];
  }

  // Check matching enum value
  const enumValues = Object.values(PlatformType);
  const matched = enumValues.find(
    (val) => val.toLowerCase() === sanitized || val.toLowerCase() === trimmed.toLowerCase(),
  );

  return matched || null;
}

export function getPlatformDisplayName(platform: PlatformType | string): string {
  const normalized = normalizePlatformType(platform);
  if (normalized && PLATFORM_DISPLAY_NAMES[normalized]) {
    return PLATFORM_DISPLAY_NAMES[normalized];
  }
  return String(platform);
}

export const SUPPORTED_PLATFORM_TYPES: PlatformType[] = Object.values(PlatformType);
