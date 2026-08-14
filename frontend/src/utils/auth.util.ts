export interface JwtPayload {
  id?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Safely decodes a JWT payload without external libraries.
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Checks if a given JWT token is non-empty, structurally valid, and not expired.
 */
export function isTokenValid(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return false;
  }
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') {
    return false;
  }
  const currentTimestampSec = Math.floor(Date.now() / 1000);
  return payload.exp > currentTimestampSec;
}

/**
 * Retrieves the stored access token from localStorage.
 * Automatically clears localStorage if the token is invalid or expired.
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    if (!isTokenValid(token)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

/**
 * Retrieves the stored refresh token from localStorage.
 */
export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('refreshToken');
  } catch {
    return null;
  }
}

/**
 * Clears authentication tokens from localStorage and dispatches auth-state-change event.
 */
export function clearAuthTokens(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new Event('auth-state-change'));
    } catch {
      // ignore SSR or restricted storage errors
    }
  }
}
