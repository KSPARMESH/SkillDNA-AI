export function sanitizeUser<T extends Record<string, any>>(user: T): Omit<T, 'passwordHash' | 'deletedAt'> {
  const { passwordHash, deletedAt, ...sanitized } = user;
  return sanitized;
}
