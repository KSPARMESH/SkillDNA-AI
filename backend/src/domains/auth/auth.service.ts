import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@skilldna/database';
import { config } from '../../config';
import { AppError, HttpStatusCode, ApiErrorCode } from '@skilldna/shared';

export class AuthService {
  static async register(data: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) {
    if (!data.password) {
      throw new AppError(
        'Password is required for registration.',
        HttpStatusCode.BAD_REQUEST,
        ApiErrorCode.VALIDATION_ERROR,
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      throw new AppError(
        'A user with this email already exists.',
        HttpStatusCode.CONFLICT,
        ApiErrorCode.RESOURCE_ALREADY_EXISTS,
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: (data.role as any) || 'STUDENT',
        profile: {
          create: {},
        },
      },
    });

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });

    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(data: { email: string; password?: string }) {
    if (!data.password) {
      throw new AppError(
        'Password is required.',
        HttpStatusCode.BAD_REQUEST,
        ApiErrorCode.VALIDATION_ERROR,
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user || !user.passwordHash) {
      throw new AppError(
        'Invalid email or password credentials.',
        HttpStatusCode.UNAUTHORIZED,
        ApiErrorCode.AUTHENTICATION_FAILED,
      );
    }

    const passwordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!passwordValid) {
      throw new AppError(
        'Invalid email or password credentials.',
        HttpStatusCode.UNAUTHORIZED,
        ApiErrorCode.AUTHENTICATION_FAILED,
      );
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });

    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
}
