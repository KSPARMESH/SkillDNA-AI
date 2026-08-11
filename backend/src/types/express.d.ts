import { JwtUserPayload } from '../middleware/auth.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}
