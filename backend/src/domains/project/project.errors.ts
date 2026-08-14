import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export class ProjectNotFoundError extends AppError {
  constructor(identifier: string) {
    super(
      `Project '${identifier}' was not found.`,
      HttpStatusCode.NOT_FOUND,
      ApiErrorCode.RESOURCE_NOT_FOUND,
    );
  }
}

export class ProjectAccessDeniedError extends AppError {
  constructor() {
    super(
      'Permission denied. You do not have permission to access or modify this project.',
      HttpStatusCode.FORBIDDEN,
      ApiErrorCode.PERMISSION_DENIED,
    );
  }
}

export class DuplicateProjectSlugError extends AppError {
  constructor(slug: string) {
    super(
      `A project with slug '${slug}' already exists for this user.`,
      HttpStatusCode.CONFLICT,
      ApiErrorCode.RESOURCE_ALREADY_EXISTS,
    );
  }
}

export class InvalidProjectInputError extends AppError {
  constructor(message: string, errors?: Array<{ field: string; message: string }>) {
    super(message, HttpStatusCode.BAD_REQUEST, ApiErrorCode.INVALID_INPUT);
    if (errors) {
      this.errors = errors;
    }
  }
}
