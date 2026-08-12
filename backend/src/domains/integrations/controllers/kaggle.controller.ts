import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth.middleware';
import { KaggleService } from '../services/kaggle.service';

export class KaggleController {
  static async sync(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'demo_user_id';
      const username = req.params.username || req.body.username;
      const accessToken = req.body.accessToken;
      const result = await KaggleService.syncUserData(userId, username, accessToken);

      res.status(200).json({
        success: true,
        message: 'Kaggle profile synchronized.',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}
