import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth.middleware';
import { CodeforcesService } from '../services/codeforces.service';

export class CodeforcesController {
  static async sync(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'demo_user_id';
      const username = req.params.username || req.body.username;
      const result = await CodeforcesService.syncUserData(userId, username);

      res.status(200).json({
        success: true,
        message: 'Codeforces profile synchronized successfully.',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
