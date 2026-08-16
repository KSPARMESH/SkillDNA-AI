export interface JwtPayload {
  id?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Safely decodes a JWT payload without external dependencies.
 * Handles base64url format, strips and adds canonical base64 padding.
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    if (typeof Buffer !== 'undefined') {
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
      return JSON.parse(jsonPayload);
    }

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const decodedText = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(decodedText);
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
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('accessToken') || null;
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
    return localStorage.getItem('refreshToken') || null;
  } catch {
    return null;
  }
}

/**
 * Stores updated authentication tokens in localStorage and dispatches auth-state-change event.
 */
export function setAuthTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      window.dispatchEvent(new Event('auth-state-change'));
    } catch {
      // ignore SSR or restricted storage errors
    }
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
