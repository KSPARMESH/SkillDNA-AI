import bcrypt from 'bcrypt';
import crypto from 'crypto';
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

    const refreshToken = jwt.sign(
      { ...payload, jti: crypto.randomUUID() },
      config.jwtRefreshSecret,
      { expiresIn: '7d' },
    );

    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      });
    } catch {
      // Non-blocking fallback
    }

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

    const refreshToken = jwt.sign(
      { ...payload, jti: crypto.randomUUID() },
      config.jwtRefreshSecret,
      { expiresIn: '7d' },
    );

    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      });
    } catch {
      // Non-blocking fallback
    }

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

  static async logout(userId: string, refreshToken?: string) {
    if (!userId) {
      throw new AppError(
        'User ID is required for logout.',
        HttpStatusCode.BAD_REQUEST,
        ApiErrorCode.INVALID_INPUT,
      );
    }

    // 1. Invalidate/revoke active refresh token(s) in the database
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          token: refreshToken,
          userId,
          revoked: false,
        },
        data: {
          revoked: true,
        },
      });
    } else {
      await prisma.refreshToken.updateMany({
        where: {
          userId,
          revoked: false,
        },
        data: {
          revoked: true,
        },
      });
    }

    // 2. Terminate active sessions for the user
    await prisma.userSession.deleteMany({
      where: {
        userId,
      },
    });

    // 3. Record audit log entry for logout
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'LOGOUT',
          entityName: 'User',
          entityId: userId,
        },
      });
    } catch {
      // Non-blocking audit log fallback
    }

    return { success: true };
  }

  static async refresh(refreshToken: string) {
    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
      throw new AppError(
        'Refresh token is required.',
        HttpStatusCode.BAD_REQUEST,
        ApiErrorCode.VALIDATION_ERROR,
      );
    }

    // 1. Verify signature and expiration using JWT refresh secret
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    } catch (error: any) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(
          'Refresh token has expired. Please log in again.',
          HttpStatusCode.UNAUTHORIZED,
          ApiErrorCode.TOKEN_EXPIRED,
        );
      }
      throw new AppError(
        'Invalid refresh token.',
        HttpStatusCode.UNAUTHORIZED,
        ApiErrorCode.AUTHENTICATION_FAILED,
      );
    }

    if (!decoded || typeof decoded !== 'object' || !decoded.id) {
      throw new AppError(
        'Invalid refresh token payload.',
        HttpStatusCode.UNAUTHORIZED,
        ApiErrorCode.AUTHENTICATION_FAILED,
      );
    }

    // 2. Query database for non-revoked refresh token record
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new AppError(
        'Refresh token record not found or has been revoked.',
        HttpStatusCode.UNAUTHORIZED,
        ApiErrorCode.AUTHENTICATION_FAILED,
      );
    }

    if (storedToken.revoked) {
      throw new AppError(
        'Refresh token has already been revoked. Please log in again.',
        HttpStatusCode.UNAUTHORIZED,
        ApiErrorCode.AUTHENTICATION_FAILED,
      );
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });
      throw new AppError(
        'Refresh token has expired. Please log in again.',
        HttpStatusCode.UNAUTHORIZED,
        ApiErrorCode.TOKEN_EXPIRED,
      );
    }

    // 3. Verify user still exists and is ACTIVE
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.deletedAt !== null || user.status !== 'ACTIVE') {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });
      throw new AppError(
        'User account associated with token is inactive or no longer exists.',
        HttpStatusCode.UNAUTHORIZED,
        ApiErrorCode.AUTHENTICATION_FAILED,
      );
    }

    // 4. Token Rotation: Invalidate the consumed refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // 5. Generate new access token and rotated refresh token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign(
      { ...payload, jti: crypto.randomUUID() },
      config.jwtRefreshSecret,
      { expiresIn: '7d' },
    );

    // 6. Save rotated refresh token in database
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: newExpiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
