import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { UserService } from './user.service';

export class UserController {
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'demo_user_id';
      const profile = await UserService.getProfile(userId);
      res.status(200).json({ success: true, message: 'User profile retrieved.', data: profile, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }
}
