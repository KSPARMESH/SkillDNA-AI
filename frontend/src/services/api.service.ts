import { getStoredAccessToken, clearAuthTokens } from '../utils/auth.util';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
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

  if (res.status === 401) {
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
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
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
