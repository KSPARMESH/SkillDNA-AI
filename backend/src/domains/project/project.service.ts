import { prisma } from '@skilldna/database';
import { CreateProjectDto, UpdateProjectDto } from './project.validator';
import { ProjectNotFoundError, ProjectAccessDeniedError } from './project.errors';

export class ProjectService {
  /**
   * Normalizes a text string into a clean, URL-safe slug.
   */
  static slugify(text: string): string {
    return (
      text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // remove special characters
        .replace(/\s+/g, '-') // replace spaces with -
        .replace(/-+/g, '-') // collapse consecutive -
        .replace(/^-+|-+$/g, '') || 'project'
    );
  }

  /**
   * Generates a unique slug for a project per user, handling collisions safely.
   */
  static async generateUniqueSlug(
    userId: string,
    title: string,
    customSlug?: string,
    excludeProjectId?: string,
  ): Promise<string> {
    const baseSlug = customSlug ? this.slugify(customSlug) : this.slugify(title);
    let candidateSlug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.project.findFirst({
        where: {
          userId,
          slug: candidateSlug,
          ...(excludeProjectId ? { NOT: { id: excludeProjectId } } : {}),
        },
      });

      if (!existing) {
        return candidateSlug;
      }

      counter += 1;
      candidateSlug = `${baseSlug}-${counter}`;
    }
  }

  /**
   * Creates a new project for an authenticated user.
   */
  static async createProject(userId: string, data: CreateProjectDto) {
    const slug = await this.generateUniqueSlug(userId, data.title, data.slug);
    const { skillIds, ...projectData } = data;

    const project = await prisma.project.create({
      data: {
        ...projectData,
        slug,
        userId,
        ...(skillIds && skillIds.length > 0
          ? {
              projectSkills: {
                create: skillIds.map((skillId) => ({ skillId })),
              },
            }
          : {}),
      },
      include: {
        projectSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    return project;
  }

  /**
   * Lists all projects belonging to the authenticated user.
   */
  static async listUserProjects(userId: string) {
    return prisma.project.findMany({
      where: { userId },
      include: {
        projectSkills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves a single project by ID, verifying user ownership.
   */
  static async getProjectById(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!project) {
      throw new ProjectNotFoundError(projectId);
    }

    if (project.userId !== userId) {
      throw new ProjectAccessDeniedError();
    }

    return project;
  }

  /**
   * Updates an existing project, verifying ownership and ensuring slug uniqueness.
   */
  static async updateProject(userId: string, projectId: string, data: UpdateProjectDto) {
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new ProjectNotFoundError(projectId);
    }

    if (existingProject.userId !== userId) {
      throw new ProjectAccessDeniedError();
    }

    const { skillIds, ...updateFields } = data;

    // Recalculate slug if title or slug was provided
    let slug = existingProject.slug;
    if (data.slug || (data.title && data.title !== existingProject.title)) {
      slug = await this.generateUniqueSlug(
        userId,
        data.title || existingProject.title,
        data.slug,
        projectId,
      );
    }

    // Sync project skills if skillIds provided
    if (skillIds !== undefined) {
      await prisma.projectSkill.deleteMany({
        where: { projectId },
      });
      if (skillIds.length > 0) {
        await prisma.projectSkill.createMany({
          data: skillIds.map((skillId) => ({ projectId, skillId })),
          skipDuplicates: true,
        });
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...updateFields,
        slug,
      },
      include: {
        projectSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    return updatedProject;
  }

  /**
   * Deletes a project, verifying user ownership.
   */
  static async deleteProject(userId: string, projectId: string) {
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new ProjectNotFoundError(projectId);
    }

    if (existingProject.userId !== userId) {
      throw new ProjectAccessDeniedError();
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return {
      id: projectId,
      deleted: true,
    };
  }
}
