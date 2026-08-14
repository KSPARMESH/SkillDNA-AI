import { Request, Response, NextFunction } from 'express';
import { ProjectService } from './project.service';
import { validateCreateProjectInput, validateUpdateProjectInput } from './project.validator';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export class ProjectController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'Authentication required.',
          HttpStatusCode.UNAUTHORIZED,
          ApiErrorCode.AUTHENTICATION_FAILED,
        );
      }

      const validatedData = validateCreateProjectInput(req.body);
      const project = await ProjectService.createProject(userId, validatedData);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Project created successfully.',
        data: project,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'Authentication required.',
          HttpStatusCode.UNAUTHORIZED,
          ApiErrorCode.AUTHENTICATION_FAILED,
        );
      }

      const projects = await ProjectService.listUserProjects(userId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Projects retrieved successfully.',
        data: projects,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'Authentication required.',
          HttpStatusCode.UNAUTHORIZED,
          ApiErrorCode.AUTHENTICATION_FAILED,
        );
      }

      const rawId = req.params.id;
      const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!projectId) {
        throw new AppError(
          'Project ID is required.',
          HttpStatusCode.BAD_REQUEST,
          ApiErrorCode.INVALID_INPUT,
        );
      }

      const project = await ProjectService.getProjectById(userId, projectId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Project retrieved successfully.',
        data: project,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'Authentication required.',
          HttpStatusCode.UNAUTHORIZED,
          ApiErrorCode.AUTHENTICATION_FAILED,
        );
      }

      const rawId = req.params.id;
      const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!projectId) {
        throw new AppError(
          'Project ID is required.',
          HttpStatusCode.BAD_REQUEST,
          ApiErrorCode.INVALID_INPUT,
        );
      }

      const validatedData = validateUpdateProjectInput(req.body);
      const project = await ProjectService.updateProject(userId, projectId, validatedData);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Project updated successfully.',
        data: project,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'Authentication required.',
          HttpStatusCode.UNAUTHORIZED,
          ApiErrorCode.AUTHENTICATION_FAILED,
        );
      }

      const rawId = req.params.id;
      const projectId = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!projectId) {
        throw new AppError(
          'Project ID is required.',
          HttpStatusCode.BAD_REQUEST,
          ApiErrorCode.INVALID_INPUT,
        );
      }

      const result = await ProjectService.deleteProject(userId, projectId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Project deleted successfully.',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
