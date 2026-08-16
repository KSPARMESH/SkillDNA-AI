'use client';

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import {
  PlatformType,
  normalizePlatformType,
  getPlatformDisplayName,
  PLATFORM_DISPLAY_NAMES,
} from '@skilldna/shared';
import {
  getSupportedPlatformsApi,
  getIntegrationsApi,
  getOAuthUrlApi,
  connectPlatformApi,
  disconnectPlatformApi,
  syncPlatformApi,
} from '@/services/api.service';

export interface IntegrationData {
  id?: string;
  platform: string;
  username: string;
  isConnected: boolean;
  lastSyncedAt?: string | null;
  syncStatus?:
    | 'SUCCESS'
    | 'SYNCING'
    | 'PENDING'
    | 'FAILED'
    | 'SYNC_FAILED'
    | 'RATE_LIMITED'
    | 'PARTIAL'
    | 'NEEDS_AUTH'
    | 'IDLE'
    | string;
  lastError?: string | null;
  metadata?: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformMetadataConfig {
  name: string;
  category: 'CODING' | 'REPOSITORY' | 'COMMUNITY';
  description: string;
  usernamePlaceholder: string;
  profileUrlPrefix?: string;
  accentColor: string;
  docsUrl?: string;
}

const DEFAULT_SUPPORTED_PLATFORMS: string[] = Object.values(PlatformType);

const PLATFORM_CONFIGS: Record<string, PlatformMetadataConfig> = {
  GITHUB: {
    name: PLATFORM_DISPLAY_NAMES[PlatformType.GITHUB] || 'GitHub',
    category: 'REPOSITORY',
    description: 'Sync public repositories, commits, star counts, pull requests, and languages.',
    usernamePlaceholder: 'e.g. torvalds',
    profileUrlPrefix: 'https://github.com/',
    accentColor: '#f0f6fc',
  },
  LEETCODE: {
    name: PLATFORM_DISPLAY_NAMES[PlatformType.LEETCODE] || 'LeetCode',
    category: 'CODING',
    description:
      'Sync algorithmic problem solving breakdown (Easy, Medium, Hard) and contest rating.',
    usernamePlaceholder: 'e.g. neetcode',
    profileUrlPrefix: 'https://leetcode.com/u/',
    accentColor: '#ffa116',
  },
  CODEFORCES: {
    name: PLATFORM_DISPLAY_NAMES[PlatformType.CODEFORCES] || 'Codeforces',
    category: 'CODING',
    description: 'Sync competitive programming rank, max rating, contribution score, and contests.',
    usernamePlaceholder: 'e.g. tourist',
    profileUrlPrefix: 'https://codeforces.com/profile/',
    accentColor: '#318ce7',
  },
  HACKERRANK: {
    name: PLATFORM_DISPLAY_NAMES[PlatformType.HACKERRANK] || 'HackerRank',
    category: 'CODING',
    description: 'Sync domain skill badges, verified assessments, stars, and problem submissions.',
    usernamePlaceholder: 'e.g. hacker_user',
    profileUrlPrefix: 'https://www.hackerrank.com/profile/',
    accentColor: '#00ea64',
  },
  STACKOVERFLOW: {
    name: PLATFORM_DISPLAY_NAMES[PlatformType.STACKOVERFLOW] || 'Stack Overflow',
    category: 'COMMUNITY',
    description: 'Sync reputation score, top answer tags, bronze/silver/gold badges, and impact.',
    usernamePlaceholder: 'e.g. 22656 or username',
    profileUrlPrefix: 'https://stackoverflow.com/users/',
    accentColor: '#f48024',
  },
  ATCODER: {
    name: PLATFORM_DISPLAY_NAMES[PlatformType.ATCODER] || 'AtCoder',
    category: 'CODING',
    description: 'Sync algorithmic contest performance, current rating, and highest rank achieved.',
    usernamePlaceholder: 'e.g. chokudai or Parmesh',
    profileUrlPrefix: 'https://atcoder.jp/users/',
    accentColor: '#22c55e',
  },
  MEDIUM: {
    name: PLATFORM_DISPLAY_NAMES[PlatformType.MEDIUM] || 'Medium',
    category: 'COMMUNITY',
    description: 'Sync published technical articles, engineering write-ups, claps, and readership.',
    usernamePlaceholder: 'e.g. @parmeshks',
    profileUrlPrefix: 'https://medium.com/@',
    accentColor: '#ffffff',
  },
  KAGGLE: {
    name: PLATFORM_DISPLAY_NAMES[PlatformType.KAGGLE] || 'Kaggle',
    category: 'CODING',
    description: 'Sync data science tier, competition medals, datasets, and notebook upvotes.',
    usernamePlaceholder: 'e.g. kaggle_expert',
    profileUrlPrefix: 'https://www.kaggle.com/',
    accentColor: '#20beff',
  },
  LINKEDIN: {
    name: PLATFORM_DISPLAY_NAMES[PlatformType.LINKEDIN] || 'LinkedIn',
    category: 'COMMUNITY',
    description: 'Sync professional engineering trajectory, credentials, and career headline.',
    usernamePlaceholder: 'e.g. parmesh-ks',
    profileUrlPrefix: 'https://www.linkedin.com/in/',
    accentColor: '#0a66c2',
  },
  DEVPOST: {
    name: PLATFORM_DISPLAY_NAMES[PlatformType.DEVPOST] || 'Devpost',
    category: 'REPOSITORY',
    description: 'Sync hackathon project submissions, winner awards, and collaborative builds.',
    usernamePlaceholder: 'e.g. devpost_builder',
    profileUrlPrefix: 'https://devpost.com/',
    accentColor: '#003e54',
  },
  CODECHEF: {
    name: PLATFORM_DISPLAY_NAMES[PlatformType.CODECHEF] || 'CodeChef',
    category: 'CODING',
    description: 'Sync competitive star ratings, division rank, and problem solving history.',
    usernamePlaceholder: 'e.g. chef_coder',
    profileUrlPrefix: 'https://www.codechef.com/users/',
    accentColor: '#964b00',
  },
};

function formatTimestamp(isoString?: string | null): string {
  if (!isoString) return 'Never synced';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Never synced';
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 0) return 'Just now';
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Never synced';
  }
}

function sanitizeErrorMessage(error?: string | null): string | null {
  if (!error) return null;
  // If error contains token/key patterns or stack traces, filter them
  if (
    error.includes('Bearer') ||
    error.includes('accessToken') ||
    error.includes('refreshToken') ||
    error.includes('password') ||
    error.includes('at Object.') ||
    error.includes('node_modules')
  ) {
    return 'Synchronization could not be completed with the platform provider. Please verify your handle.';
  }
  return error.replace(/\s+/g, ' ').trim();
}

function PlatformIcon({
  platform,
  className = 'w-6 h-6',
}: {
  platform: string;
  className?: string;
}) {
  const norm = normalizePlatformType(platform) || platform.toUpperCase();

  switch (norm) {
    case 'GITHUB':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
      );
    case 'LEETCODE':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .666-1.607L9.947 8.08l4.5-4.823a1.378 1.378 0 0 0-.964-3.257z" />
          <path d="M18.825 8.784h-9.5c-.76 0-1.375.615-1.375 1.375s.615 1.375 1.375 1.375h9.5c.76 0 1.375-.615 1.375-1.375s-.615-1.375-1.375-1.375z" />
        </svg>
      );
    case 'CODEFORCES':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.5 7.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-3 0V9a1.5 1.5 0 0 1 1.5-1.5zm7.5-4.5a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-3 0V4.5A1.5 1.5 0 0 1 12 3zm7.5 7.5a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-3 0V12a1.5 1.5 0 0 1 1.5-1.5z" />
        </svg>
      );
    case 'HACKERRANK':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0L1.608 6v12L12 24l10.392-6V6L12 0zm3.627 15.657h-1.922v-3.086H10.29v3.086H8.368V8.343h1.922v3.029h3.415V8.343h1.922v7.314z" />
        </svg>
      );
    case 'STACKOVERFLOW':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.986 21.865v-6.408h2.156V24H2.871v-8.543h2.156v6.408h13.959zM6.924 17.514h9.878v-2.156H6.924v2.156zm.536-5.01l9.467 2.825.642-2.062-9.467-2.825-.642 2.062zm1.88-4.717l8.28 5.617 1.206-1.78-8.28-5.617-1.206 1.78zm3.82-4.148l6.47 7.647 1.642-1.39-6.47-7.647-1.642 1.39zM16.993.42l-2.003 1.05 4.545 8.955 2.003-1.05L16.993.42z" />
        </svg>
      );
    case 'MEDIUM':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
        </svg>
      );
    case 'LINKEDIN':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      );
    case 'KAGGLE':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.825 23.859c-.022.091-.115.141-.281.141h-3.139c-.187 0-.351-.082-.492-.246l-4.717-6.07-1.428 1.371v4.672c0 .188-.082.281-.246.281H5.748c-.164 0-.246-.093-.246-.281V.281C5.502.093 5.584 0 5.748 0h2.774c.164 0 .246.093.246.281v14.153l5.889-5.918c.141-.141.305-.211.492-.211h3.28c.165 0 .258.07.281.211.024.164-.035.293-.176.387l-6.287 6.117 6.638 8.461c.142.117.188.246.14.388z" />
        </svg>
      );
    case 'DEVPOST':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.002 1.61L0 12.004 6.002 22.39h11.996L24 12.004 17.998 1.61H6.002zm1.593 4.084h3.947c2.753 0 4.885 1.488 4.885 4.31 0 2.821-2.132 4.31-4.885 4.31H7.595V5.694zm2.52 2.222v4.175h1.427c1.472 0 2.366-.807 2.366-2.087 0-1.281-.894-2.088-2.366-2.088H10.115z" />
        </svg>
      );
    case 'ATCODER':
    case 'CODECHEF':
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      );
  }
}

export default function IntegrationsPage() {
  const [supportedPlatforms, setSupportedPlatforms] = useState<string[]>(
    DEFAULT_SUPPORTED_PLATFORMS,
  );
  const [integrations, setIntegrations] = useState<IntegrationData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter / Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<
    'ALL' | 'CONNECTED' | 'DISCONNECTED' | 'CODING' | 'REPOSITORY' | 'COMMUNITY'
  >('ALL');

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Connect Modal state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('GITHUB');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [connectValidationError, setConnectValidationError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectApiError, setConnectApiError] = useState<string | null>(null);

  // Disconnect Modal state
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState<boolean>(false);
  const [platformToDisconnect, setPlatformToDisconnect] = useState<{
    platform: string;
    username?: string;
  } | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [disconnectApiError, setDisconnectApiError] = useState<string | null>(null);

  // Syncing state per platform
  const [syncingMap, setSyncingMap] = useState<Record<string, boolean>>({});
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);

  // Fetch initial data directly from backend (Source of Truth)
  const fetchData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [platformsRes, integrationsRes] = await Promise.allSettled([
        getSupportedPlatformsApi(),
        getIntegrationsApi(),
      ]);

      if (
        platformsRes.status === 'fulfilled' &&
        platformsRes.value?.success &&
        Array.isArray(platformsRes.value.data?.supportedPlatforms)
      ) {
        // Normalize platform keys to exact enum values
        const normalized = platformsRes.value.data.supportedPlatforms.map(
          (p: string) => normalizePlatformType(p) || p.toUpperCase(),
        );
        setSupportedPlatforms(normalized);
      }

      if (integrationsRes.status === 'fulfilled') {
        const intData = integrationsRes.value;
        if (intData?.success && Array.isArray(intData.data)) {
          setIntegrations(intData.data);
        } else if (intData?.success === false) {
          setFetchError(intData.message || 'Unable to retrieve user platform integrations.');
        }
      } else {
        setFetchError('Failed to communicate with backend integration services.');
      }
    } catch (err: any) {
      setFetchError(err?.message || 'A network error occurred while loading integrations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check for LinkedIn OAuth redirect parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const linkedinParam = params.get('linkedin');
      const reasonParam = params.get('reason');

      if (linkedinParam === 'connected') {
        setSuccessMessage('LinkedIn connected successfully! Profile synchronization initiated.');
        const url = new URL(window.location.href);
        url.searchParams.delete('linkedin');
        url.searchParams.delete('reason');
        window.history.replaceState({}, document.title, url.pathname);
      } else if (linkedinParam === 'error') {
        const msg =
          reasonParam === 'cancelled'
            ? 'LinkedIn authorization was cancelled.'
            : reasonParam === 'invalid_state'
              ? 'OAuth state verification failed. Please try connecting again.'
              : 'LinkedIn OAuth authorization failed. Please try connecting again.';
        setErrorMessage(msg);
        const url = new URL(window.location.href);
        url.searchParams.delete('linkedin');
        url.searchParams.delete('reason');
        window.history.replaceState({}, document.title, url.pathname);
      }
    }
  }, []);

  // Map of connected integrations keyed by normalized uppercase platform name
  const connectedMap = useMemo(() => {
    const map = new Map<string, IntegrationData>();
    integrations.forEach((item) => {
      if (item && item.platform && item.isConnected) {
        const key = (normalizePlatformType(item.platform) || item.platform).toUpperCase();
        map.set(key, item);
      }
    });
    return map;
  }, [integrations]);

  // Combined full list of all available platforms with integration status
  const platformList = useMemo(() => {
    return supportedPlatforms.map((platformKey) => {
      const key = (normalizePlatformType(platformKey) || platformKey).toUpperCase();
      const config = PLATFORM_CONFIGS[key] || {
        name: getPlatformDisplayName(key),
        category: 'CODING',
        description: `Connect and synchronize your technical footprint from ${getPlatformDisplayName(key)}.`,
        usernamePlaceholder: `e.g. ${key.toLowerCase()}_user`,
        accentColor: '#38bdf8',
      };
      const activeIntegration = connectedMap.get(key);
      const rawStatus = (activeIntegration?.syncStatus || 'IDLE').toUpperCase();
      const normalizedStatus = rawStatus === 'SYNC_FAILED' ? 'FAILED' : rawStatus;
      const isSyncingThis = Boolean(syncingMap[key]);

      const lastError =
        activeIntegration?.lastError ||
        activeIntegration?.metadata?.lastError ||
        (normalizedStatus === 'FAILED' || normalizedStatus === 'RATE_LIMITED'
          ? activeIntegration?.metadata?.error || null
          : null);

      return {
        key,
        name: config.name,
        category: config.category,
        description: config.description,
        usernamePlaceholder: config.usernamePlaceholder,
        profileUrlPrefix: config.profileUrlPrefix,
        accentColor: config.accentColor,
        isConnected: Boolean(activeIntegration && activeIntegration.isConnected),
        username: activeIntegration?.username || null,
        lastSyncedAt: activeIntegration?.lastSyncedAt || null,
        syncStatus: isSyncingThis ? 'SYNCING' : normalizedStatus,
        lastError: lastError ? String(lastError) : null,
        metadata: activeIntegration?.metadata || null,
        integrationId: activeIntegration?.id || null,
      };
    });
  }, [supportedPlatforms, connectedMap, syncingMap]);

  // Filtered platform list based on search and category tab
  const filteredPlatforms = useMemo(() => {
    return platformList.filter((item) => {
      // Category filter
      if (categoryFilter === 'CONNECTED' && !item.isConnected) return false;
      if (categoryFilter === 'DISCONNECTED' && item.isConnected) return false;
      if (categoryFilter === 'CODING' && item.category !== 'CODING') return false;
      if (categoryFilter === 'REPOSITORY' && item.category !== 'REPOSITORY') return false;
      if (categoryFilter === 'COMMUNITY' && item.category !== 'COMMUNITY') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesKey = item.key.toLowerCase().includes(q);
        const matchesUsername = item.username?.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        return matchesName || matchesKey || matchesUsername || matchesDesc;
      }

      return true;
    });
  }, [platformList, categoryFilter, searchQuery]);

  // Quick stats
  const totalPlatformsCount = platformList.length;
  const connectedCount = platformList.filter((p) => p.isConnected).length;
  const recentSyncTime = useMemo(() => {
    const timestamps = platformList
      .map((p) => p.lastSyncedAt)
      .filter((ts): ts is string => Boolean(ts))
      .map((ts) => new Date(ts).getTime())
      .filter((time) => !isNaN(time));
    if (timestamps.length === 0) return null;
    const max = Math.max(...timestamps);
    return new Date(max).toISOString();
  }, [platformList]);

  // =========================================================================
  // CONNECT & OAUTH HANDLERS
  // =========================================================================
  const handleConnectLinkedInOAuth = async () => {
    setIsConnecting(true);
    setConnectApiError(null);
    try {
      const res = await getOAuthUrlApi('LINKEDIN');
      if (res && res.success && res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setConnectApiError(
          res?.message || 'Failed to initiate LinkedIn OAuth. Please try again later.',
        );
        setIsConnecting(false);
      }
    } catch (err: any) {
      setConnectApiError(err?.message || 'An error occurred while connecting to LinkedIn OAuth.');
      setIsConnecting(false);
    }
  };

  const handleOpenConnectModal = (preselectedPlatform?: string) => {
    const normalized = preselectedPlatform
      ? normalizePlatformType(preselectedPlatform) || preselectedPlatform.toUpperCase()
      : null;

    if (normalized === 'LINKEDIN') {
      handleConnectLinkedInOAuth();
      return;
    }

    const platformToPick =
      normalized || supportedPlatforms.find((p) => p !== 'LINKEDIN') || 'GITHUB';
    setSelectedPlatform(platformToPick);
    setUsernameInput('');
    setConnectValidationError(null);
    setConnectApiError(null);
    setIsConnectModalOpen(true);
  };

  const handleCloseConnectModal = () => {
    setIsConnectModalOpen(false);
    setUsernameInput('');
    setConnectValidationError(null);
    setConnectApiError(null);
  };

  const handleConnectSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConnectValidationError(null);
    setConnectApiError(null);

    const trimmedUsername = usernameInput.trim();
    const normalizedPlatform = normalizePlatformType(selectedPlatform);

    // Client-side validation
    if (!normalizedPlatform) {
      setConnectValidationError('Please select a valid supported platform.');
      return;
    }

    if (!trimmedUsername) {
      setConnectValidationError('Platform handle / username is required.');
      return;
    }

    if (trimmedUsername.length < 1 || trimmedUsername.length > 100) {
      setConnectValidationError('Username must be between 1 and 100 characters.');
      return;
    }

    setIsConnecting(true);
    try {
      const response = await connectPlatformApi({
        platform: normalizedPlatform,
        username: trimmedUsername,
      });

      if (response && response.success) {
        // Backend returns connect payload with isConnected: true
        const connectData = response.data;
        const initialStatus = (connectData?.syncStatus || 'SYNCING').toUpperCase();
        const initialLastSynced = connectData?.lastSyncedAt || null;

        const newIntegration: IntegrationData = {
          id: connectData?.id,
          platform: normalizedPlatform,
          username: trimmedUsername,
          isConnected: true,
          syncStatus: initialStatus,
          lastSyncedAt: initialLastSynced,
          metadata: connectData?.metadata || null,
        };

        setIntegrations((prev) => {
          const filtered = prev.filter(
            (i) =>
              (normalizePlatformType(i.platform) || i.platform.toUpperCase()) !==
              normalizedPlatform,
          );
          return [newIntegration, ...filtered];
        });

        // If backend returns SYNCING or PENDING, track in syncingMap
        if (initialStatus === 'SYNCING' || initialStatus === 'PENDING') {
          setSyncingMap((prev) => ({ ...prev, [normalizedPlatform]: true }));
        }

        setSuccessMessage(
          `Successfully connected ${PLATFORM_CONFIGS[normalizedPlatform]?.name || getPlatformDisplayName(normalizedPlatform)} (@${trimmedUsername})! Initial synchronization initiated.`,
        );
        handleCloseConnectModal();

        // Refresh / re-fetch backend status after connection to capture the definitive synchronization result
        const pollBackendStatus = async () => {
          try {
            const freshIntegrations = await getIntegrationsApi();
            if (
              freshIntegrations &&
              freshIntegrations.success &&
              Array.isArray(freshIntegrations.data)
            ) {
              setIntegrations(freshIntegrations.data);
              const target = freshIntegrations.data.find(
                (i: any) =>
                  (normalizePlatformType(i.platform) || i.platform.toUpperCase()) ===
                  normalizedPlatform,
              );
              if (target && target.syncStatus !== 'SYNCING' && target.syncStatus !== 'PENDING') {
                setSyncingMap((prev) => ({ ...prev, [normalizedPlatform]: false }));
                return true;
              }
            }
          } catch {
            // Safe fallback
          }
          return false;
        };

        setTimeout(async () => {
          const finished = await pollBackendStatus();
          if (!finished) {
            setTimeout(async () => {
              const finished2 = await pollBackendStatus();
              if (!finished2) {
                setTimeout(async () => {
                  await pollBackendStatus();
                  setSyncingMap((prev) => ({ ...prev, [normalizedPlatform]: false }));
                }, 3000);
              }
            }, 2000);
          }
        }, 1200);
      } else {
        setConnectApiError(
          response?.message ||
            `Failed to connect to ${PLATFORM_CONFIGS[normalizedPlatform]?.name || getPlatformDisplayName(normalizedPlatform)}. Please verify your username and try again.`,
        );
      }
    } catch (err: any) {
      setConnectApiError(
        err?.message ||
          'A network error occurred while connecting the platform. Please check your connection.',
      );
    } finally {
      setIsConnecting(false);
    }
  };

  // =========================================================================
  // DISCONNECT MODAL HANDLERS
  // =========================================================================
  const handleOpenDisconnectModal = (platform: string, username?: string | null) => {
    const norm = normalizePlatformType(platform) || platform.toUpperCase();
    setPlatformToDisconnect({ platform: norm, username: username || undefined });
    setDisconnectApiError(null);
    setIsDisconnectModalOpen(true);
  };

  const handleCloseDisconnectModal = () => {
    setIsDisconnectModalOpen(false);
    setPlatformToDisconnect(null);
    setDisconnectApiError(null);
  };

  const handleConfirmDisconnect = async () => {
    if (!platformToDisconnect) return;

    const platformKey = (
      normalizePlatformType(platformToDisconnect.platform) || platformToDisconnect.platform
    ).toUpperCase();
    setIsDisconnecting(true);
    setDisconnectApiError(null);

    try {
      const response = await disconnectPlatformApi(platformKey);

      if (response && response.success) {
        // Immediate state update: remove platform or mark disconnected
        setIntegrations((prev) =>
          prev.filter(
            (i) => (normalizePlatformType(i.platform) || i.platform.toUpperCase()) !== platformKey,
          ),
        );

        setSuccessMessage(
          `Successfully disconnected ${PLATFORM_CONFIGS[platformKey]?.name || getPlatformDisplayName(platformKey)}.`,
        );
        handleCloseDisconnectModal();
      } else {
        setDisconnectApiError(
          response?.message ||
            `Failed to disconnect platform ${getPlatformDisplayName(platformKey)}.`,
        );
      }
    } catch (err: any) {
      setDisconnectApiError(
        err?.message || 'A network error occurred while disconnecting the platform.',
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  // =========================================================================
  // SYNC HANDLERS
  // =========================================================================
  const handleSyncPlatform = async (platformKey: string) => {
    const key = (normalizePlatformType(platformKey) || platformKey).toUpperCase();
    setSyncingMap((prev) => ({ ...prev, [key]: true }));
    setErrorMessage(null);

    // Immediately set optimistic sync status to SYNCING in UI while waiting for backend result
    setIntegrations((prev) =>
      prev.map((item) =>
        (normalizePlatformType(item.platform) || item.platform.toUpperCase()) === key
          ? { ...item, syncStatus: 'SYNCING' }
          : item,
      ),
    );

    try {
      const response = await syncPlatformApi(key, { mode: 'INCREMENTAL' });

      if (response && response.success && response.data?.status === 'SUCCESS') {
        const syncedAtIso = response.data.syncedAt
          ? new Date(response.data.syncedAt).toISOString()
          : new Date().toISOString();

        setIntegrations((prev) =>
          prev.map((item) =>
            (normalizePlatformType(item.platform) || item.platform.toUpperCase()) === key
              ? {
                  ...item,
                  lastSyncedAt: syncedAtIso,
                  syncStatus: 'SUCCESS',
                  lastError: null,
                  metadata: response.data?.data?.rawMetadata || item.metadata,
                }
              : item,
          ),
        );
        setSuccessMessage(
          `Synchronized ${PLATFORM_CONFIGS[key]?.name || getPlatformDisplayName(key)} data successfully!`,
        );
      } else if (
        response &&
        response.success &&
        (response.data?.status === 'PARTIAL' || response.data?.status === 'NEEDS_AUTH')
      ) {
        const limitationMsg =
          response.data.limitation ||
          (response.data.status === 'NEEDS_AUTH'
            ? 'OAuth authorization required for full profile sync.'
            : 'Synchronized with partial metadata.');

        setIntegrations((prev) =>
          prev.map((item) =>
            (normalizePlatformType(item.platform) || item.platform.toUpperCase()) === key
              ? {
                  ...item,
                  syncStatus: response.data.status,
                  lastError: limitationMsg,
                  metadata: response.data?.data?.rawMetadata || item.metadata,
                }
              : item,
          ),
        );
        setSuccessMessage(
          `${PLATFORM_CONFIGS[key]?.name || getPlatformDisplayName(key)}: ${limitationMsg}`,
        );
      } else {
        // Backend returned failure
        const failureReason =
          response?.data?.error ||
          response?.message ||
          `Failed to synchronize ${PLATFORM_CONFIGS[key]?.name || getPlatformDisplayName(key)}.`;

        const failureStatus = response?.data?.status === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'FAILED';

        setIntegrations((prev) =>
          prev.map((item) =>
            (normalizePlatformType(item.platform) || item.platform.toUpperCase()) === key
              ? {
                  ...item,
                  syncStatus: failureStatus,
                  lastError: failureReason,
                  metadata: { ...(item.metadata || {}), lastError: failureReason },
                }
              : item,
          ),
        );
        setErrorMessage(failureReason);
      }
    } catch (err: any) {
      const errMsg =
        err?.message || `Network error occurred while syncing ${getPlatformDisplayName(key)}.`;
      setIntegrations((prev) =>
        prev.map((item) =>
          (normalizePlatformType(item.platform) || item.platform.toUpperCase()) === key
            ? {
                ...item,
                syncStatus: 'FAILED',
                lastError: errMsg,
                metadata: { ...(item.metadata || {}), lastError: errMsg },
              }
            : item,
        ),
      );
      setErrorMessage(errMsg);
    } finally {
      setSyncingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSyncAllPlatforms = async () => {
    if (connectedCount === 0) return;
    setIsSyncingAll(true);
    setErrorMessage(null);

    // Set all connected to SYNCING
    setIntegrations((prev) =>
      prev.map((item) => (item.isConnected ? { ...item, syncStatus: 'SYNCING' } : item)),
    );

    try {
      const response = await syncPlatformApi(undefined, { mode: 'INCREMENTAL' });

      if (response && response.success) {
        // Re-fetch direct from backend to ensure accurate state
        const freshData = await getIntegrationsApi();
        if (freshData && freshData.success && Array.isArray(freshData.data)) {
          setIntegrations(freshData.data);
        }
        setSuccessMessage('Synchronization request completed across all connected platforms.');
      } else {
        setErrorMessage(response?.message || 'Failed to complete full synchronization.');
        const freshData = await getIntegrationsApi();
        if (freshData && freshData.success && Array.isArray(freshData.data)) {
          setIntegrations(freshData.data);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred while syncing all platforms.');
      try {
        const freshData = await getIntegrationsApi();
        if (freshData && freshData.success && Array.isArray(freshData.data)) {
          setIntegrations(freshData.data);
        }
      } catch {
        // Ignore
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Sync status pill component
  const renderSyncStatusBadge = (status?: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'SUCCESS':
        return (
          <span
            id="sync-status-badge-success"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/80 border border-emerald-800/80 text-emerald-400"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Synced
          </span>
        );
      case 'SYNCING':
        return (
          <span
            id="sync-status-badge-syncing"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-950/80 border border-sky-800/80 text-sky-400"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
            Syncing...
          </span>
        );
      case 'PENDING':
        return (
          <span
            id="sync-status-badge-pending"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/80 border border-amber-800/80 text-amber-400"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Pending Sync
          </span>
        );
      case 'FAILED':
      case 'SYNC_FAILED':
        return (
          <span
            id="sync-status-badge-failed"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/80 border border-rose-800/80 text-rose-400"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Sync Failed
          </span>
        );
      case 'RATE_LIMITED':
        return (
          <span
            id="sync-status-badge-rate-limited"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/80 border border-amber-800/80 text-amber-400"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Rate Limited
          </span>
        );
      case 'PARTIAL':
        return (
          <span
            id="sync-status-badge-partial"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/80 border border-amber-800/80 text-amber-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Limited Sync
          </span>
        );
      case 'NEEDS_AUTH':
        return (
          <span
            id="sync-status-badge-needs-auth"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/80 border border-amber-800/80 text-amber-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Needs OAuth
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span
            id="sync-status-badge-idle"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900 border border-slate-800 text-slate-400"
          >
            Not Synced
          </span>
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8 max-w-6xl mx-auto pb-16">
        {/* ========================================================================= */}
        {/* HEADER & HERO SECTION */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1
                id="integrations-page-title"
                className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight"
              >
                Platform Integrations
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px] font-bold rounded-full">
                {connectedCount} / {totalPlatformsCount} Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Connect your developer profiles, competitive programming accounts, and technical
              writing handles. SkillDNA synchronizes your public activity into your verified Living
              Technical Identity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              id="sync-all-btn"
              onClick={handleSyncAllPlatforms}
              disabled={isSyncingAll || connectedCount === 0}
              className="px-4 py-2 text-xs font-semibold text-slate-200 border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              title={
                connectedCount === 0
                  ? 'Connect at least one platform to sync'
                  : 'Sync all connected platforms'
              }
            >
              <svg
                className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin text-emerald-400' : 'text-slate-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isSyncingAll ? 'Syncing All...' : 'Sync All'}
            </button>

            <button
              id="connect-platform-btn"
              onClick={() => handleOpenConnectModal()}
              className="glass-button px-5 py-2 text-xs font-bold text-emerald-400 rounded-xl flex items-center gap-2 hover:border-emerald-400 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <span className="text-base leading-none font-black">+</span>
              Connect Platform
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUMMARY STATS BAR */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Available Platforms
              </p>
              <p id="total-platforms-count" className="text-xl font-bold text-slate-100">
                {totalPlatformsCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>

          <div className="glass-panel p-4 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Connected Accounts
              </p>
              <p id="active-integrations-count" className="text-xl font-bold text-emerald-400">
                {connectedCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <div className="glass-panel p-4 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Latest Sync
              </p>
              <p id="latest-sync-time" className="text-sm font-bold text-slate-200">
                {formatTimestamp(recentSyncTime)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GLOBAL NOTIFICATION BANNERS */}
        {/* ========================================================================= */}
        {successMessage && (
          <div
            id="integrations-success-alert"
            className="p-4 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs font-semibold text-emerald-300 flex items-center justify-between shadow-lg shadow-emerald-950/20 animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-sm">✓</span>
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div
            id="integrations-error-alert"
            className="p-4 bg-rose-950/70 border border-rose-800 rounded-xl text-xs font-semibold text-rose-300 flex items-center justify-between shadow-lg shadow-rose-950/20 animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <span className="text-rose-400 text-sm">✕</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 text-xs ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FILTER & SEARCH TOOLBAR */}
        {/* ========================================================================= */}
        <div className="glass-panel p-3 sm:p-4 border border-slate-800 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                categoryFilter === 'ALL'
                  ? 'bg-emerald-950 border border-emerald-700 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              All Platforms ({platformList.length})
            </button>
            <button
              onClick={() => setCategoryFilter('CONNECTED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                categoryFilter === 'CONNECTED'
                  ? 'bg-emerald-950 border border-emerald-700 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Connected ({connectedCount})
            </button>
            <button
              onClick={() => setCategoryFilter('DISCONNECTED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                categoryFilter === 'DISCONNECTED'
                  ? 'bg-emerald-950 border border-emerald-700 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Available ({totalPlatformsCount - connectedCount})
            </button>
            <button
              onClick={() => setCategoryFilter('CODING')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                categoryFilter === 'CODING'
                  ? 'bg-emerald-950 border border-emerald-700 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Coding & CP
            </button>
            <button
              onClick={() => setCategoryFilter('REPOSITORY')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                categoryFilter === 'REPOSITORY'
                  ? 'bg-emerald-950 border border-emerald-700 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Code Repositories
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <input
              id="integrations-search-input"
              type="text"
              placeholder="Search platform or handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
            <svg
              className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LOADING SKELETON */}
        {/* ========================================================================= */}
        {isLoading && (
          <div id="integrations-loading-skeleton" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="glass-panel p-6 space-y-4 border border-slate-800/80 animate-pulse"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
                      <div className="space-y-2">
                        <div className="w-24 h-4 bg-slate-800 rounded"></div>
                        <div className="w-16 h-3 bg-slate-900 rounded"></div>
                      </div>
                    </div>
                    <div className="w-20 h-5 bg-slate-800 rounded-full"></div>
                  </div>
                  <div className="w-full h-10 bg-slate-900/60 rounded-lg"></div>
                  <div className="pt-2 flex justify-between">
                    <div className="w-24 h-6 bg-slate-800 rounded"></div>
                    <div className="w-20 h-6 bg-slate-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-slate-400 font-medium pt-2">
              Loading platform integrations catalogue...
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FETCH ERROR STATE */}
        {/* ========================================================================= */}
        {!isLoading && fetchError && (
          <div className="glass-panel p-8 text-center space-y-4 border border-rose-900/50 bg-rose-950/20">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-300">
                Failed to load platform integrations
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">{fetchError}</p>
            </div>
            <button
              id="retry-fetch-btn"
              onClick={fetchData}
              className="px-4 py-2 text-xs font-bold text-emerald-400 border border-emerald-800 rounded-lg hover:bg-emerald-950/60 transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EMPTY STATE */}
        {/* ========================================================================= */}
        {!isLoading && !fetchError && filteredPlatforms.length === 0 && (
          <div
            id="integrations-empty-state"
            className="glass-panel p-12 text-center space-y-4 border border-dashed border-slate-800 rounded-2xl"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-xl">
              🔍
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-200">No matching platforms found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No platform matches your current search term or filter criteria. Try adjusting your
                query.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
              }}
              className="glass-button px-4 py-2 text-xs font-bold text-emerald-400 rounded-xl inline-flex items-center gap-1.5"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PLATFORMS GRID */}
        {/* ========================================================================= */}
        {!isLoading && !fetchError && filteredPlatforms.length > 0 && (
          <div
            id="platforms-grid-container"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredPlatforms.map((platform) => {
              const isSyncingThis = Boolean(syncingMap[platform.key]);

              return (
                <div
                  key={platform.key}
                  id={`platform-card-${platform.key.toLowerCase()}`}
                  className={`glass-panel p-5 space-y-4 border transition-all flex flex-col justify-between ${
                    platform.isConnected
                      ? 'border-slate-800 hover:border-emerald-500/40 bg-slate-950/40'
                      : 'border-slate-800/80 hover:border-slate-700 bg-slate-950/20'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Card Header: Platform Icon, Name & Connection Status */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-200 shadow-inner"
                          style={{ color: platform.accentColor }}
                        >
                          <PlatformIcon platform={platform.key} className="w-5 h-5" />
                        </div>
                        <div>
                          <h3
                            id={`platform-name-${platform.key.toLowerCase()}`}
                            className="text-base font-bold text-slate-100 flex items-center gap-1.5"
                          >
                            {platform.name}
                          </h3>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {platform.category}
                          </span>
                        </div>
                      </div>

                      {/* Connection Badge */}
                      {platform.isConnected ? (
                        <span
                          id={`platform-status-badge-${platform.key.toLowerCase()}`}
                          className="px-2.5 py-1 bg-emerald-950/90 border border-emerald-800 text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1.5 shadow-sm"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Connected
                        </span>
                      ) : (
                        <span
                          id={`platform-status-badge-${platform.key.toLowerCase()}`}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-semibold rounded-full"
                        >
                          Available
                        </span>
                      )}
                    </div>

                    {/* Platform Description */}
                    <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
                      {platform.description}
                    </p>

                    {/* Connected Metadata Details */}
                    {platform.isConnected ? (
                      <div className="p-3 bg-slate-900/80 border border-slate-800/90 rounded-xl space-y-2.5">
                        {/* Username row */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Account Handle:</span>
                          <span
                            id={`platform-username-${platform.key.toLowerCase()}`}
                            className="font-mono font-bold text-emerald-400 flex items-center gap-1"
                          >
                            @{platform.username}
                            {platform.profileUrlPrefix && (
                              <a
                                href={`${platform.profileUrlPrefix}${platform.username?.replace(/^@/, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 hover:text-emerald-400 transition-colors ml-0.5"
                                title="Open Public Profile"
                              >
                                ↗
                              </a>
                            )}
                          </span>
                        </div>

                        {/* Last Synced row */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Last Synced:</span>
                          <span
                            id={`platform-last-synced-${platform.key.toLowerCase()}`}
                            className="text-slate-300 font-medium"
                          >
                            {formatTimestamp(platform.lastSyncedAt)}
                          </span>
                        </div>

                        {/* Sync Status row */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Sync Status:</span>
                          {renderSyncStatusBadge(platform.syncStatus)}
                        </div>

                        {/* Error info if sync failed */}
                        {platform.lastError && (
                          <div
                            id={`platform-error-${platform.key.toLowerCase()}`}
                            className="p-2 bg-rose-950/50 border border-rose-900/70 rounded-lg text-[11px] text-rose-300 flex items-start gap-1.5"
                          >
                            <span className="text-rose-400 font-bold leading-none mt-0.5">⚠️</span>
                            <span className="leading-tight">
                              {sanitizeErrorMessage(platform.lastError)}
                            </span>
                          </div>
                        )}

                        {/* Relevant Metadata if returned by backend */}
                        {platform.metadata &&
                          Object.keys(platform.metadata).filter(
                            (k) => k !== 'lastError' && k !== 'failedAt',
                          ).length > 0 && (
                            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                              {Object.entries(platform.metadata)
                                .filter(([k]) => k !== 'lastError' && k !== 'failedAt')
                                .slice(0, 3)
                                .map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 text-[10px] rounded font-mono"
                                  >
                                    {k}: <strong className="text-slate-100">{String(v)}</strong>
                                  </span>
                                ))}
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
                        <span>Not connected yet</span>
                        <span className="text-[10px] text-slate-500">Public profile</span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {platform.isConnected ? (
                      <>
                        <button
                          id={`sync-btn-${platform.key.toLowerCase()}`}
                          onClick={() => handleSyncPlatform(platform.key)}
                          disabled={isSyncingThis || isSyncingAll}
                          className="px-3.5 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-800/80 bg-emerald-950/40 rounded-lg hover:bg-emerald-900/40 hover:text-emerald-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                          title="Trigger platform synchronization"
                        >
                          <svg
                            className={`w-3 h-3 ${isSyncingThis ? 'animate-spin' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          {isSyncingThis ? 'Syncing...' : 'Sync Now'}
                        </button>

                        <button
                          id={`disconnect-btn-${platform.key.toLowerCase()}`}
                          onClick={() => handleOpenDisconnectModal(platform.key, platform.username)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-400 border border-rose-900/60 bg-rose-950/30 rounded-lg hover:bg-rose-900/40 hover:text-rose-300 transition-all"
                          title="Disconnect this platform integration"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : platform.key === 'LINKEDIN' ? (
                      <button
                        id="connect-btn-linkedin"
                        onClick={handleConnectLinkedInOAuth}
                        disabled={isConnecting}
                        className="w-full glass-button px-4 py-2 text-xs font-bold text-sky-400 border border-sky-800/80 bg-sky-950/40 rounded-lg flex items-center justify-center gap-1.5 hover:border-sky-400 hover:text-sky-300 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                        </svg>
                        <span>Connect with LinkedIn</span>
                      </button>
                    ) : (
                      <button
                        id={`connect-btn-${platform.key.toLowerCase()}`}
                        onClick={() => handleOpenConnectModal(platform.key)}
                        className="w-full glass-button px-4 py-2 text-xs font-bold text-emerald-400 rounded-lg flex items-center justify-center gap-1.5 hover:border-emerald-400 transition-all cursor-pointer"
                      >
                        <span>+</span>
                        Connect {platform.name}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CONNECT PLATFORM MODAL */}
        {/* ========================================================================= */}
        {isConnectModalOpen && (
          <div
            id="connect-platform-modal-overlay"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div
              id="connect-platform-modal"
              className="glass-panel w-full max-w-lg p-6 sm:p-7 space-y-5 border border-slate-700 shadow-2xl animate-scale-up"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-3.5">
                <div className="space-y-0.5">
                  <h2 className="text-lg font-bold text-slate-100">Connect Platform Integration</h2>
                  <p className="text-xs text-slate-400">
                    Link your public developer profile to import verified contributions and skill
                    metrics.
                  </p>
                </div>
                <button
                  id="close-connect-modal-btn"
                  onClick={handleCloseConnectModal}
                  disabled={isConnecting}
                  className="text-slate-400 hover:text-slate-200 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              {/* API Error Notification */}
              {connectApiError && (
                <div
                  id="connect-api-error"
                  className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-xs text-rose-300 font-medium"
                >
                  {connectApiError}
                </div>
              )}

              <form onSubmit={handleConnectSubmit} className="space-y-4">
                {/* Platform Selection */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="connect-platform-select"
                    className="text-xs font-semibold text-slate-300"
                  >
                    Select Platform
                  </label>
                  <select
                    id="connect-platform-select"
                    value={selectedPlatform}
                    onChange={(e) => {
                      const val = (
                        normalizePlatformType(e.target.value) || e.target.value
                      ).toUpperCase();
                      setSelectedPlatform(val);
                      setConnectValidationError(null);
                    }}
                    disabled={isConnecting}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    {supportedPlatforms.map((plat) => {
                      const platKey = (normalizePlatformType(plat) || plat).toUpperCase();
                      const cfg = PLATFORM_CONFIGS[platKey];
                      const displayName = cfg ? cfg.name : getPlatformDisplayName(platKey);
                      const isAlreadyConnected = Boolean(connectedMap.get(platKey));
                      return (
                        <option key={platKey} value={platKey}>
                          {displayName} {isAlreadyConnected ? '(Connected)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedPlatform === 'LINKEDIN' ? (
                  <div className="space-y-4 py-2">
                    <div className="p-4 bg-sky-950/40 border border-sky-800/80 rounded-xl space-y-2 text-xs text-sky-200">
                      <div className="flex items-center gap-2 font-bold text-sky-300">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                        </svg>
                        LinkedIn OAuth 2.0 Authorization Required
                      </div>
                      <p className="leading-relaxed text-slate-300 text-[11px]">
                        LinkedIn requires secure OAuth authorization to verify your identity. You
                        will be redirected to LinkedIn to approve read access to your basic profile
                        and email.
                      </p>
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        id="cancel-connect-btn"
                        onClick={handleCloseConnectModal}
                        disabled={isConnecting}
                        className="px-4 py-2 text-xs font-semibold text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        id="modal-connect-linkedin-btn"
                        onClick={handleConnectLinkedInOAuth}
                        disabled={isConnecting}
                        className="glass-button px-5 py-2 text-xs font-bold text-sky-400 bg-sky-950/60 border border-sky-700 rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-sky-950/30 hover:border-sky-400"
                      >
                        {isConnecting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
                            Redirecting to LinkedIn...
                          </>
                        ) : (
                          <>
                            <span>Authorize with LinkedIn</span>
                            <span>→</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Username Input */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="connect-username-input"
                        className="text-xs font-semibold text-slate-300 flex justify-between"
                      >
                        <span>Platform Username / Handle</span>
                        <span className="text-[10px] text-slate-500">
                          Public profile identifier
                        </span>
                      </label>
                      <input
                        id="connect-username-input"
                        type="text"
                        placeholder={
                          PLATFORM_CONFIGS[
                            (
                              normalizePlatformType(selectedPlatform) || selectedPlatform
                            ).toUpperCase()
                          ]?.usernamePlaceholder || 'e.g. username'
                        }
                        value={usernameInput}
                        onChange={(e) => {
                          setUsernameInput(e.target.value);
                          setConnectValidationError(null);
                        }}
                        disabled={isConnecting}
                        autoFocus
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50 font-mono"
                      />
                      {connectValidationError && (
                        <p
                          id="connect-validation-error"
                          className="text-[10px] text-rose-400 font-medium"
                        >
                          {connectValidationError}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                        🔒 SkillDNA fetches only your public achievements and telemetry. We never
                        require passwords or private repository keys for username-based sync.
                      </p>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        id="cancel-connect-btn"
                        onClick={handleCloseConnectModal}
                        disabled={isConnecting}
                        className="px-4 py-2 text-xs font-semibold text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        id="submit-connect-btn"
                        disabled={isConnecting}
                        className="glass-button px-5 py-2 text-xs font-bold text-emerald-400 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-950/30"
                      >
                        {isConnecting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                            Connecting & Syncing...
                          </>
                        ) : (
                          'Connect & Sync'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DISCONNECT CONFIRMATION MODAL */}
        {/* ========================================================================= */}
        {isDisconnectModalOpen && platformToDisconnect && (
          <div
            id="disconnect-modal-overlay"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div
              id="disconnect-confirm-modal"
              className="glass-panel w-full max-w-md p-6 space-y-4 border border-rose-900/60 shadow-2xl animate-scale-up bg-slate-950"
            >
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800 flex items-center justify-center text-rose-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Disconnect Integration</h3>
                  <p className="text-xs text-slate-400">
                    Confirm disconnection for{' '}
                    {PLATFORM_CONFIGS[platformToDisconnect.platform]?.name ||
                      getPlatformDisplayName(platformToDisconnect.platform)}
                  </p>
                </div>
              </div>

              {disconnectApiError && (
                <div
                  id="disconnect-api-error"
                  className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-xs text-rose-300 font-medium"
                >
                  {disconnectApiError}
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to disconnect{' '}
                <strong className="text-emerald-400">
                  {PLATFORM_CONFIGS[platformToDisconnect.platform]?.name ||
                    getPlatformDisplayName(platformToDisconnect.platform)}
                </strong>
                {platformToDisconnect.username && (
                  <span className="font-mono text-slate-200">
                    {' '}
                    (@{platformToDisconnect.username})
                  </span>
                )}
                ?
              </p>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                <p className="text-slate-300 font-semibold">What happens when you disconnect:</p>
                <p>• Automated metric synchronization will immediately stop.</p>
                <p>• Your platform username and connection record will be cleared.</p>
                <p>• You can reconnect your profile at any time.</p>
              </div>

              <div className="flex justify-end items-center gap-3 pt-2">
                <button
                  type="button"
                  id="cancel-disconnect-btn"
                  onClick={handleCloseDisconnectModal}
                  disabled={isDisconnecting}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-disconnect-btn"
                  onClick={handleConfirmDisconnect}
                  disabled={isDisconnecting}
                  className="px-4 py-2 text-xs font-bold text-rose-300 bg-rose-950/80 border border-rose-800 rounded-xl hover:bg-rose-900 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDisconnecting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    'Disconnect Platform'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
