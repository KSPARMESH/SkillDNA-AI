import {
  getStoredAccessToken,
  getStoredRefreshToken,
  setAuthTokens,
  clearAuthTokens,
} from '../utils/auth.util';

// Single-flight shared refresh promise to prevent duplicate concurrent refresh calls
let refreshPromise: Promise<string | null> | null = null;

/**
 * Performs refresh token request to POST /api/v1/auth/refresh.
 * Uses a single-flight promise so simultaneous 401s share the same refresh call.
 */
export async function refreshAccessTokenApi(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        clearAuthTokens();
        return null;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearAuthTokens();
        return null;
      }

      const json = await res.json();
      if (json.success && json.data?.accessToken) {
        setAuthTokens(json.data.accessToken, json.data.refreshToken);
        return json.data.accessToken as string;
      } else {
        clearAuthTokens();
        return null;
      }
    } catch {
      clearAuthTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Centralized fetch helper with automatic single-retry token refresh on 401.
 */
export async function fetchApi(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  const token = getStoredAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401 occurs on an authenticated endpoint and we haven't retried yet:
  const isAuthEndpoint =
    endpoint.startsWith('/auth/login') ||
    endpoint.startsWith('/auth/register') ||
    endpoint.startsWith('/auth/refresh');

  if (res.status === 401 && retryCount === 0 && !isAuthEndpoint) {
    const newAccessToken = await refreshAccessTokenApi();

    if (newAccessToken) {
      // Retry original request exactly ONCE with new access token
      const retryHeaders: Record<string, string> = {
        ...headers,
        Authorization: `Bearer ${newAccessToken}`,
      };
      return fetchApi(endpoint, { ...options, headers: retryHeaders }, 1);
    }

    // Refresh failed -> redirect to login
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    return res.json();
  }

  if (res.status === 401 && !isAuthEndpoint) {
    clearAuthTokens();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  return res.json();
}

/**
 * Calls backend POST /api/v1/auth/logout and guarantees that local auth tokens are cleared.
 */
export async function logoutApi(): Promise<{ success: boolean; message?: string }> {
  const token = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  try {
    if (token) {
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refreshToken: refreshToken || undefined }),
      });
    }
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Failed to communicate with logout endpoint',
    };
  } finally {
    clearAuthTokens();
  }
}

/**
 * Fetches authenticated user profile from GET /api/v1/users/me
 */
export async function getProfileApi() {
  return fetchApi('/users/me', { method: 'GET' });
}

/**
 * Updates authenticated user profile via PUT /api/v1/users/me
 */
export async function updateProfileApi(data: Record<string, any>) {
  return fetchApi('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Fetches all projects for the authenticated user from GET /api/v1/projects
 */
export async function getProjectsApi() {
  return fetchApi('/projects', { method: 'GET' });
}

/**
 * Fetches a single project by ID from GET /api/v1/projects/:id
 */
export async function getProjectByIdApi(id: string) {
  return fetchApi(`/projects/${id}`, { method: 'GET' });
}

/**
 * Creates a new project via POST /api/v1/projects
 */
export async function createProjectApi(data: Record<string, any>) {
  return fetchApi('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Updates an existing project via PUT /api/v1/projects/:id
 */
export async function updateProjectApi(id: string, data: Record<string, any>) {
  return fetchApi(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Deletes a project via DELETE /api/v1/projects/:id
 */
export async function deleteProjectApi(id: string) {
  return fetchApi(`/projects/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Fetches list of all supported integration platforms from GET /api/v1/integrations/platforms
 */
export async function getSupportedPlatformsApi() {
  return fetchApi('/integrations/platforms', { method: 'GET' });
}

/**
 * Fetches all platform integrations for the authenticated user from GET /api/v1/integrations
 */
export async function getIntegrationsApi() {
  return fetchApi('/integrations', { method: 'GET' });
}

/**
 * Fetches integration status summary from GET /api/v1/integrations/status
 */
export async function getIntegrationStatusApi() {
  return fetchApi('/integrations/status', { method: 'GET' });
}

/**
 * Connects a platform integration via POST /api/v1/integrations/connect
 */
export async function connectPlatformApi(data: {
  platform: string;
  username: string;
  accessToken?: string;
  refreshToken?: string;
  metadata?: Record<string, any>;
}) {
  return fetchApi('/integrations/connect', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Disconnects a platform integration via POST /api/v1/integrations/disconnect
 */
export async function disconnectPlatformApi(platform: string) {
  return fetchApi('/integrations/disconnect', {
    method: 'POST',
    body: JSON.stringify({ platform }),
  });
}

/**
 * Triggers platform sync via POST /api/v1/integrations/sync or /api/v1/integrations/sync/:platform
 */
export async function syncPlatformApi(
  platform?: string,
  options?: { mode?: 'FULL' | 'INCREMENTAL'; force?: boolean },
) {
  const endpoint = platform ? `/integrations/sync/${platform}` : '/integrations/sync';
  return fetchApi(endpoint, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

/**
 * Fetches synchronization history logs from GET /api/v1/integrations/sync/history
 */
export async function getSyncHistoryApi() {
  return fetchApi('/integrations/sync/history', { method: 'GET' });
}

/**
 * Fetches the authenticated user's latest persisted SkillDNA report via GET /api/v1/ai/skill-dna-report
 */
export async function getSkillDnaReportApi() {
  return fetchApi('/ai/skill-dna-report', {
    method: 'GET',
  });
}

/**
 * Triggers AI generation or regeneration of SkillDNA Report via POST /api/v1/ai/skill-dna-report
 */
export async function generateSkillDnaReportApi() {
  return fetchApi('/ai/skill-dna-report', {
    method: 'POST',
  });
}
