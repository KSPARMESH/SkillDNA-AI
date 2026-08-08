import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 bytes

export function encryptPayload(text: string): { iv: string; encryptedData: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return { iv: iv.toString('hex'), encryptedData: encrypted, tag };
}

export function decryptPayload(encryptedData: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
