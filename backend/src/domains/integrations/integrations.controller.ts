import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { SyncController } from './controllers/sync.controller';

export class IntegrationsController {
  static async sync(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    return SyncController.sync(req, res, next);
  }
}
