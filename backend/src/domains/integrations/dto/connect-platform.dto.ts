import { PlatformType } from '@skilldna/shared';

export interface ConnectPlatformDto {
  platform: PlatformType;
  username: string;
  accessToken?: string;
  refreshToken?: string;
  metadata?: Record<string, any>;
}
