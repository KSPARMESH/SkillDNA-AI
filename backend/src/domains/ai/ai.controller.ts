import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export class AiController {
  static async getLatestReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'Authentication required to retrieve SkillDNA report.',
          HttpStatusCode.UNAUTHORIZED,
          ApiErrorCode.AUTHENTICATION_FAILED,
        );
      }

      const report = await AiService.getLatestSkillDnaReport(userId);

      if (!report) {
        return res.status(200).json({
          success: true,
          statusCode: 200,
          message: 'No SkillDNA report found for the authenticated user.',
          data: null,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Latest SkillDNA Report retrieved successfully.',
        data: report,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(
          'Authentication required to generate SkillDNA report.',
          HttpStatusCode.UNAUTHORIZED,
          ApiErrorCode.AUTHENTICATION_FAILED,
        );
      }

      // Security: Strictly isolate execution to the JWT authenticated user (ignoring body userId)
      const report = await AiService.generateSkillDnaReport(userId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'SkillDNA Report generated via Gemini AI.',
        data: report,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
