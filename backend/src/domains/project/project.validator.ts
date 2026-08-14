import { ProjectCategory } from '@skilldna/shared';
import { InvalidProjectInputError } from './project.errors';

export interface CreateProjectDto {
  title: string;
  slug?: string;
  description: string;
  category?: ProjectCategory;
  repoUrl?: string | null;
  liveUrl?: string | null;
  techStack?: string[];
  starsCount?: number;
  forksCount?: number;
  linesOfCode?: number;
  status?: string;
  skillIds?: string[];
}

export interface UpdateProjectDto {
  title?: string;
  slug?: string;
  description?: string;
  category?: ProjectCategory;
  repoUrl?: string | null;
  liveUrl?: string | null;
  techStack?: string[];
  starsCount?: number;
  forksCount?: number;
  linesOfCode?: number;
  status?: string;
  skillIds?: string[];
}

export const VALID_PROJECT_CATEGORIES: ProjectCategory[] = [
  ProjectCategory.WEB_APP,
  ProjectCategory.MOBILE_APP,
  ProjectCategory.BACKEND_SERVICE,
  ProjectCategory.AI_ML_MODEL,
  ProjectCategory.CLI_TOOL,
  ProjectCategory.OPEN_SOURCE,
  ProjectCategory.OTHER,
];

export function validateCreateProjectInput(data: any): CreateProjectDto {
  if (!data || typeof data !== 'object') {
    throw new InvalidProjectInputError('Project payload must be an object.');
  }

  const errors: Array<{ field: string; message: string }> = [];

  // Title validation
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.push({ field: 'title', message: 'Title is required and must be a non-empty string.' });
  } else if (data.title.trim().length > 150) {
    errors.push({ field: 'title', message: 'Title must not exceed 150 characters.' });
  }

  // Description validation
  if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
    errors.push({
      field: 'description',
      message: 'Description is required and must be a non-empty string.',
    });
  } else if (data.description.trim().length > 5000) {
    errors.push({ field: 'description', message: 'Description must not exceed 5000 characters.' });
  }

  // Category validation
  let category: ProjectCategory = ProjectCategory.WEB_APP;
  if (data.category !== undefined && data.category !== null) {
    if (!VALID_PROJECT_CATEGORIES.includes(data.category as ProjectCategory)) {
      errors.push({
        field: 'category',
        message: `Invalid project category '${data.category}'. Valid categories: ${VALID_PROJECT_CATEGORIES.join(', ')}.`,
      });
    } else {
      category = data.category as ProjectCategory;
    }
  }

  // Numbers validation
  if (data.starsCount !== undefined && data.starsCount !== null) {
    const stars = Number(data.starsCount);
    if (isNaN(stars) || stars < 0 || !Number.isInteger(stars)) {
      errors.push({ field: 'starsCount', message: 'starsCount must be a non-negative integer.' });
    }
  }

  if (data.forksCount !== undefined && data.forksCount !== null) {
    const forks = Number(data.forksCount);
    if (isNaN(forks) || forks < 0 || !Number.isInteger(forks)) {
      errors.push({ field: 'forksCount', message: 'forksCount must be a non-negative integer.' });
    }
  }

  if (data.linesOfCode !== undefined && data.linesOfCode !== null) {
    const loc = Number(data.linesOfCode);
    if (isNaN(loc) || loc < 0 || !Number.isInteger(loc)) {
      errors.push({ field: 'linesOfCode', message: 'linesOfCode must be a non-negative integer.' });
    }
  }

  // Tech stack validation
  let techStack: string[] = [];
  if (data.techStack !== undefined && data.techStack !== null) {
    if (!Array.isArray(data.techStack)) {
      errors.push({ field: 'techStack', message: 'techStack must be an array of strings.' });
    } else {
      techStack = data.techStack
        .filter((item: any) => typeof item === 'string' && item.trim())
        .map((item: string) => item.trim().slice(0, 50));
    }
  }

  // Skill IDs validation
  let skillIds: string[] | undefined = undefined;
  if (data.skillIds !== undefined && data.skillIds !== null) {
    if (!Array.isArray(data.skillIds)) {
      errors.push({ field: 'skillIds', message: 'skillIds must be an array of skill IDs.' });
    } else {
      skillIds = data.skillIds.filter((id: any) => typeof id === 'string' && id.trim());
    }
  }

  if (errors.length > 0) {
    throw new InvalidProjectInputError(
      `Project validation failed: ${errors.map((e) => e.message).join(' ')}`,
      errors,
    );
  }

  return {
    title: data.title.trim(),
    slug: data.slug && typeof data.slug === 'string' ? data.slug.trim() : undefined,
    description: data.description.trim(),
    category,
    repoUrl: data.repoUrl && typeof data.repoUrl === 'string' ? data.repoUrl.trim() : undefined,
    liveUrl: data.liveUrl && typeof data.liveUrl === 'string' ? data.liveUrl.trim() : undefined,
    techStack,
    starsCount:
      data.starsCount !== undefined && data.starsCount !== null ? Number(data.starsCount) : 0,
    forksCount:
      data.forksCount !== undefined && data.forksCount !== null ? Number(data.forksCount) : 0,
    linesOfCode:
      data.linesOfCode !== undefined && data.linesOfCode !== null ? Number(data.linesOfCode) : 0,
    status: data.status && typeof data.status === 'string' ? data.status.trim() : 'COMPLETED',
    skillIds,
  };
}

export function validateUpdateProjectInput(data: any): UpdateProjectDto {
  if (!data || typeof data !== 'object') {
    throw new InvalidProjectInputError('Project update payload must be an object.');
  }

  const errors: Array<{ field: string; message: string }> = [];
  const result: UpdateProjectDto = {};

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || !data.title.trim()) {
      errors.push({ field: 'title', message: 'Title must be a non-empty string.' });
    } else if (data.title.trim().length > 150) {
      errors.push({ field: 'title', message: 'Title must not exceed 150 characters.' });
    } else {
      result.title = data.title.trim();
    }
  }

  if (data.slug !== undefined) {
    if (typeof data.slug !== 'string' || !data.slug.trim()) {
      errors.push({ field: 'slug', message: 'Slug must be a non-empty string.' });
    } else {
      result.slug = data.slug.trim();
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== 'string' || !data.description.trim()) {
      errors.push({ field: 'description', message: 'Description must be a non-empty string.' });
    } else if (data.description.trim().length > 5000) {
      errors.push({
        field: 'description',
        message: 'Description must not exceed 5000 characters.',
      });
    } else {
      result.description = data.description.trim();
    }
  }

  if (data.category !== undefined) {
    if (!VALID_PROJECT_CATEGORIES.includes(data.category as ProjectCategory)) {
      errors.push({
        field: 'category',
        message: `Invalid project category '${data.category}'. Valid categories: ${VALID_PROJECT_CATEGORIES.join(', ')}.`,
      });
    } else {
      result.category = data.category as ProjectCategory;
    }
  }

  if (data.repoUrl !== undefined) {
    result.repoUrl =
      typeof data.repoUrl === 'string' && data.repoUrl.trim() ? data.repoUrl.trim() : null;
  }

  if (data.liveUrl !== undefined) {
    result.liveUrl =
      typeof data.liveUrl === 'string' && data.liveUrl.trim() ? data.liveUrl.trim() : null;
  }

  if (data.techStack !== undefined) {
    if (!Array.isArray(data.techStack)) {
      errors.push({ field: 'techStack', message: 'techStack must be an array of strings.' });
    } else {
      result.techStack = data.techStack
        .filter((item: any) => typeof item === 'string' && item.trim())
        .map((item: string) => item.trim().slice(0, 50));
    }
  }

  if (data.starsCount !== undefined && data.starsCount !== null) {
    const stars = Number(data.starsCount);
    if (isNaN(stars) || stars < 0 || !Number.isInteger(stars)) {
      errors.push({ field: 'starsCount', message: 'starsCount must be a non-negative integer.' });
    } else {
      result.starsCount = stars;
    }
  }

  if (data.forksCount !== undefined && data.forksCount !== null) {
    const forks = Number(data.forksCount);
    if (isNaN(forks) || forks < 0 || !Number.isInteger(forks)) {
      errors.push({ field: 'forksCount', message: 'forksCount must be a non-negative integer.' });
    } else {
      result.forksCount = forks;
    }
  }

  if (data.linesOfCode !== undefined && data.linesOfCode !== null) {
    const loc = Number(data.linesOfCode);
    if (isNaN(loc) || loc < 0 || !Number.isInteger(loc)) {
      errors.push({ field: 'linesOfCode', message: 'linesOfCode must be a non-negative integer.' });
    } else {
      result.linesOfCode = loc;
    }
  }

  if (data.status !== undefined) {
    result.status =
      typeof data.status === 'string' && data.status.trim() ? data.status.trim() : 'COMPLETED';
  }

  if (data.skillIds !== undefined) {
    if (!Array.isArray(data.skillIds)) {
      errors.push({ field: 'skillIds', message: 'skillIds must be an array of skill IDs.' });
    } else {
      result.skillIds = data.skillIds.filter((id: any) => typeof id === 'string' && id.trim());
    }
  }

  if (errors.length > 0) {
    throw new InvalidProjectInputError(
      `Project update validation failed: ${errors.map((e) => e.message).join(' ')}`,
      errors,
    );
  }

  return result;
}
