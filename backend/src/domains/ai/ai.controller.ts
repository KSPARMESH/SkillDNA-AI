import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AiService } from './ai.service';

export class AiController {
  static async generateReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'demo_user_id';
      const report = await AiService.generateSkillDnaReport(userId);
      res.status(200).json({ success: true, message: 'SkillDNA Report generated via Gemini AI.', data: report, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }
}
