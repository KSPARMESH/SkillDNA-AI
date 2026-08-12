import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth.middleware';
import { AtCoderService } from '../services/atcoder.service';

export class AtCoderController {
  static async sync(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'demo_user_id';
      const username = req.params.username || req.body.username;
      const result = await AtCoderService.syncUserData(userId, username);

      res.status(200).json({
        success: true,
        message: 'AtCoder profile synchronized successfully.',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
