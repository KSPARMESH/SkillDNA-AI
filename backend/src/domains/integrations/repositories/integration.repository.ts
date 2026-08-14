import { prisma } from '@skilldna/database';
import { PlatformType, normalizePlatformType } from '@skilldna/shared';
import { encryptPayload, decryptPayload } from '../../../utils/crypto.util';

export class IntegrationRepository {
  static async upsertIntegration(data: {
    userId: string;
    platform: PlatformType | string;
    username: string;
    accessToken?: string;
    refreshToken?: string;
    metadata?: Record<string, any>;
  }) {
    const validPlatform = (normalizePlatformType(data.platform) || data.platform) as PlatformType;
    let encryptedAccess: string | undefined = undefined;
    let encryptedRefresh: string | undefined = undefined;

    if (data.accessToken) {
      const { iv, encryptedData, tag } = encryptPayload(data.accessToken);
      encryptedAccess = `${iv}:${tag}:${encryptedData}`;
    }

    if (data.refreshToken) {
      const { iv, encryptedData, tag } = encryptPayload(data.refreshToken);
      encryptedRefresh = `${iv}:${tag}:${encryptedData}`;
    }

    return prisma.platformIntegration.upsert({
      where: {
        userId_platform: {
          userId: data.userId,
          platform: validPlatform,
        },
      },
      create: {
        userId: data.userId,
        platform: validPlatform,
        username: data.username,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        isConnected: true,
        syncStatus: 'IDLE',
        metadata: data.metadata || {},
      },
      update: {
        username: data.username,
        accessToken: encryptedAccess || undefined,
        refreshToken: encryptedRefresh || undefined,
        isConnected: true,
        syncStatus: 'IDLE',
        metadata: data.metadata || undefined,
      },
    });
  }

  static async findByUserIdAndPlatform(userId: string, platform: PlatformType | string) {
    const validPlatform = (normalizePlatformType(platform) || platform) as PlatformType;
    const integration = await prisma.platformIntegration.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: validPlatform,
        },
      },
    });

    if (!integration) return null;

    return this.decryptTokens(integration);
  }

  static async findAllByUserId(userId: string) {
    const list = await prisma.platformIntegration.findMany({
      where: { userId },
    });
    return list.map((item) => this.decryptTokens(item));
  }

  static async disconnectIntegration(userId: string, platform: PlatformType | string) {
    const validPlatform = (normalizePlatformType(platform) || platform) as PlatformType;
    return prisma.platformIntegration.updateMany({
      where: { userId, platform: validPlatform },
      data: {
        isConnected: false,
        accessToken: null,
        refreshToken: null,
        syncStatus: 'DISCONNECTED',
      },
    });
  }

  static async updateSyncStatus(
    id: string,
    status: string,
    lastSyncedAt?: Date,
    metadata?: Record<string, any>,
  ) {
    return prisma.platformIntegration.update({
      where: { id },
      data: {
        syncStatus: status,
        ...(lastSyncedAt ? { lastSyncedAt } : {}),
        ...(metadata ? { metadata } : {}),
      },
    });
  }

  static async updateTokens(id: string, accessToken: string, refreshToken?: string) {
    const { iv: aIv, encryptedData: aData, tag: aTag } = encryptPayload(accessToken);
    const encryptedAccess = `${aIv}:${aTag}:${aData}`;

    let encryptedRefresh: string | undefined = undefined;
    if (refreshToken) {
      const { iv: rIv, encryptedData: rData, tag: rTag } = encryptPayload(refreshToken);
      encryptedRefresh = `${rIv}:${rTag}:${rData}`;
    }

    return prisma.platformIntegration.update({
      where: { id },
      data: {
        accessToken: encryptedAccess,
        ...(encryptedRefresh ? { refreshToken: encryptedRefresh } : {}),
      },
    });
  }

  static async findActiveIntegrationsForSync(limit = 50) {
    const list = await prisma.platformIntegration.findMany({
      where: {
        isConnected: true,
      },
      take: limit,
      orderBy: {
        updatedAt: 'asc',
      },
    });
    return list.map((item) => this.decryptTokens(item));
  }

  private static decryptTokens(integration: any) {
    const decrypted = { ...integration };

    if (decrypted.accessToken && decrypted.accessToken.includes(':')) {
      try {
        const [iv, tag, encryptedData] = decrypted.accessToken.split(':');
        decrypted.accessToken = decryptPayload(encryptedData, iv, tag);
      } catch {
        decrypted.accessToken = undefined;
      }
    }

    if (decrypted.refreshToken && decrypted.refreshToken.includes(':')) {
      try {
        const [iv, tag, encryptedData] = decrypted.refreshToken.split(':');
        decrypted.refreshToken = decryptPayload(encryptedData, iv, tag);
      } catch {
        decrypted.refreshToken = undefined;
      }
    }

    return decrypted;
  }
}
