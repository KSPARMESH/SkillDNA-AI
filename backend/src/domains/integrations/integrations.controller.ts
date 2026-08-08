import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { IntegrationsService } from './integrations.service';

export class IntegrationsController {
  static async sync(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { platform } = req.params;
      const userId = req.user?.id || 'demo_user_id';
      const result = await IntegrationsService.syncPlatform(userId, platform);
      res.status(200).json({ success: true, message: `Platform ${platform} synced successfully.`, data: result, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  }
}
