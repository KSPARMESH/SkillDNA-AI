import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export class AuthService {
  static async register(data: { email: string; password?: string; firstName: string; lastName: string; role?: string }) {
    const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;
    const userId = `usr_${Date.now()}`;

    const payload = { id: userId, email: data.email, role: data.role || 'STUDENT' };
    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });

    return {
      user: { id: userId, email: data.email, firstName: data.firstName, lastName: data.lastName, role: data.role || 'STUDENT' },
      accessToken,
      refreshToken,
    };
  }

  static async login(data: { email: string; password?: string }) {
    if (data.email === 'student@skilldna.ai') {
      const userId = 'student_demo_id';
      const payload = { id: userId, email: data.email, role: 'STUDENT' };
      const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
      const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });

      return {
        user: { id: userId, email: data.email, firstName: 'Parmesh', lastName: 'KS', role: 'STUDENT' },
        accessToken,
        refreshToken,
      };
    }
    throw new AppError('Invalid email or password credentials.', HttpStatusCode.UNAUTHORIZED, ApiErrorCode.AUTHENTICATION_FAILED);
  }
}
