import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import {
  validateRegistrationInput,
  ValidationError,
  AppError,
  HttpStatusCode,
  ApiErrorCode,
} from '@skilldna/shared';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateRegistrationInput(req.body);
      if (!validation.valid) {
        throw new ValidationError('Registration payload validation failed.', validation.errors);
      }
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body?.refreshToken;
      if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
        throw new AppError(
          'Refresh token is required.',
          HttpStatusCode.BAD_REQUEST,
          ApiErrorCode.VALIDATION_ERROR,
        );
      }
      const result = await AuthService.refresh(refreshToken.trim());
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Token refreshed successfully.',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'Authentication required.',
          HttpStatusCode.UNAUTHORIZED,
          ApiErrorCode.AUTHENTICATION_FAILED,
        );
      }
      const refreshToken = req.body?.refreshToken;
      await AuthService.logout(userId, refreshToken);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Logged out successfully.',
        data: null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
