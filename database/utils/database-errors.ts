export class DatabaseError extends Error {
  constructor(message: string, public code = 'DB_ERROR') {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends DatabaseError {
  constructor(entityName: string, id?: string) {
    super(`${entityName} with identifier '${id || 'unknown'}' was not found.`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UniqueConstraintError extends DatabaseError {
  constructor(field: string) {
    super(`A record with the specified ${field} already exists.`, 'UNIQUE_CONSTRAINT_VIOLATION');
    this.name = 'UniqueConstraintError';
  }
}
