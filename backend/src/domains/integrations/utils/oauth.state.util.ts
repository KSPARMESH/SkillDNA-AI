import crypto from 'crypto';
import { OAuthAuthenticationError } from '../errors/integration.errors';

export interface IOAuthStatePayload {
  userId: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
}

// In-memory nonce store with TTL to prevent OAuth replay attacks
class NonceStore {
  private consumedNonces = new Map<string, number>();

  consume(nonce: string, expiresAt: number): boolean {
    this.cleanup();
    if (this.consumedNonces.has(nonce)) {
      return false; // Replay detected
    }
    this.consumedNonces.set(nonce, expiresAt);
    return true;
  }

  has(nonce: string): boolean {
    return this.consumedNonces.has(nonce);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [nonce, exp] of this.consumedNonces.entries()) {
      if (exp < now) {
        this.consumedNonces.delete(nonce);
      }
    }
  }

  reset(): void {
    this.consumedNonces.clear();
  }
}

const nonceStore = new NonceStore();

function getSecretKey(): string {
  return (
    process.env.JWT_SECRET ||
    process.env.SESSION_SECRET ||
    'skilldna_oauth_state_signing_key_secret_min_32_chars'
  );
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Generates a signed, tamper-proof, user-bound OAuth state parameter.
 */
export function generateOAuthState(userId: string, ttlMs = 10 * 60 * 1000): string {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new OAuthAuthenticationError('Cannot generate OAuth state without valid userId.');
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  const payload: IOAuthStatePayload = {
    userId: userId.trim(),
    nonce,
    issuedAt: now,
    expiresAt: now + ttlMs,
  };

  const payloadString = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(payloadString);

  const signature = crypto
    .createHmac('sha256', getSecretKey())
    .update(encodedPayload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies the signed OAuth state token and consumes its nonce to prevent replay attacks.
 * Returns the authenticated userId on success.
 */
export function verifyAndConsumeOAuthState(state?: string): {
  userId: string;
  payload: IOAuthStatePayload;
} {
  if (!state || typeof state !== 'string' || state.trim() === '') {
    throw new OAuthAuthenticationError('Missing or empty OAuth state parameter.');
  }

  const parts = state.trim().split('.');
  if (parts.length !== 2) {
    throw new OAuthAuthenticationError('Malformed OAuth state format.');
  }

  const [encodedPayload, providedSignature] = parts;

  // 1. Verify HMAC Signature
  const expectedSignature = crypto
    .createHmac('sha256', getSecretKey())
    .update(encodedPayload)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const providedBuf = Buffer.from(providedSignature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    throw new OAuthAuthenticationError('Invalid or tampered OAuth state signature.');
  }

  // 2. Parse Payload
  let payload: IOAuthStatePayload;
  try {
    const jsonStr = base64UrlDecode(encodedPayload);
    payload = JSON.parse(jsonStr);
  } catch {
    throw new OAuthAuthenticationError('Failed to parse OAuth state payload.');
  }

  if (!payload.userId || !payload.nonce || !payload.expiresAt) {
    throw new OAuthAuthenticationError('Incomplete OAuth state claims.');
  }

  // 3. Check Expiry
  const now = Date.now();
  if (now > payload.expiresAt) {
    throw new OAuthAuthenticationError(
      'OAuth state parameter has expired. Please try connecting again.',
    );
  }

  // 4. Replay Check
  const consumedSuccessfully = nonceStore.consume(payload.nonce, payload.expiresAt);
  if (!consumedSuccessfully) {
    throw new OAuthAuthenticationError('OAuth state has already been consumed (replay detected).');
  }

  return { userId: payload.userId, payload };
}

/**
 * Helper for unit test suites to clear consumed state cache.
 */
export function resetOAuthStateStore(): void {
  nonceStore.reset();
}
