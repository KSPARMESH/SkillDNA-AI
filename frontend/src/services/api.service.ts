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
