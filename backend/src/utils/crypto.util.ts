import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes IV for AES-256-GCM compatibility

/**
 * Validates and parses an encryption key into a 32-byte Buffer.
 * Supports:
 * - 64-character hex string (32 bytes)
 * - 44-character Base64 string (32 bytes)
 * - 32-byte UTF-8 string (32 bytes)
 *
 * Security: NEVER includes key content or secrets in error messages.
 */
export function parseAndValidateKey(key?: string, isProduction = false): Buffer {
  if (!key || key.trim() === '') {
    if (isProduction) {
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: ENCRYPTION_KEY environment variable is missing in production. Application startup aborted.',
      );
    }
    throw new Error(
      'ENCRYPTION_KEY is not configured. Encryption and decryption operations require a valid 32-byte key.',
    );
  }

  const trimmedKey = key.trim();

  // 1. Check if 64-character hexadecimal (32 bytes)
  if (/^[0-9a-fA-F]{64}$/.test(trimmedKey)) {
    const buf = Buffer.from(trimmedKey, 'hex');
    if (buf.length === 32) {
      return buf;
    }
  }

  // 2. Check if 44-character Base64 string resolving to 32 bytes
  if (
    trimmedKey.length === 44 &&
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(trimmedKey)
  ) {
    const buf = Buffer.from(trimmedKey, 'base64');
    if (buf.length === 32) {
      return buf;
    }
  }

  // 3. Check if 32-byte UTF-8 string
  const utf8Buf = Buffer.from(trimmedKey, 'utf8');
  if (utf8Buf.length === 32) {
    return utf8Buf;
  }

  // Key format/length is invalid
  throw new Error(
    'CRITICAL CONFIGURATION ERROR: Invalid ENCRYPTION_KEY length/format. Key must resolve to exactly 32 bytes (256 bits) for AES-256-GCM (e.g., 64-char hex or 32-char utf-8).',
  );
}

/**
 * Dynamically resolves and validates the active encryption key Buffer.
 * Fails safely if missing or invalid.
 */
export function getEncryptionKey(): Buffer {
  const isProduction = process.env.NODE_ENV === 'production';
  return parseAndValidateKey(process.env.ENCRYPTION_KEY, isProduction);
}

/**
 * Encrypts plaintext string using AES-256-GCM with a random 16-byte IV.
 * Returns IV, ciphertext, and authentication tag in hex.
 */
export function encryptPayload(
  text: string,
  customKey?: Buffer | string,
): { iv: string; encryptedData: string; tag: string } {
  const keyBuffer = customKey
    ? typeof customKey === 'string'
      ? parseAndValidateKey(customKey)
      : customKey
    : getEncryptionKey();

  if (keyBuffer.length !== 32) {
    throw new Error(
      'CRITICAL CONFIGURATION ERROR: Invalid key length for AES-256-GCM encryption (must be 32 bytes).',
    );
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return { iv: iv.toString('hex'), encryptedData: encrypted, tag };
}

/**
 * Decrypts AES-256-GCM ciphertext using the provided IV and authentication tag.
 * Returns decrypted UTF-8 plaintext.
 */
export function decryptPayload(
  encryptedData: string,
  iv: string,
  tag: string,
  customKey?: Buffer | string,
): string {
  const keyBuffer = customKey
    ? typeof customKey === 'string'
      ? parseAndValidateKey(customKey)
      : customKey
    : getEncryptionKey();

  if (keyBuffer.length !== 32) {
    throw new Error(
      'CRITICAL CONFIGURATION ERROR: Invalid key length for AES-256-GCM decryption (must be 32 bytes).',
    );
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
