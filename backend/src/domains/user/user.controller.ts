import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'Authentication required.',
          HttpStatusCode.UNAUTHORIZED,
          ApiErrorCode.AUTHENTICATION_FAILED,
        );
      }
      const profile = await UserService.getProfile(userId);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User profile retrieved successfully.',
        data: profile,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'Authentication required.',
          HttpStatusCode.UNAUTHORIZED,
          ApiErrorCode.AUTHENTICATION_FAILED,
        );
      }
      const profile = await UserService.updateProfile(userId, req.body);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User profile updated successfully.',
        data: profile,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!id) {
        throw new AppError(
          'User ID parameter is required.',
          HttpStatusCode.BAD_REQUEST,
          ApiErrorCode.INVALID_INPUT,
        );
      }
      const profile = await UserService.getUserById(id);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User profile retrieved successfully.',
        data: profile,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
