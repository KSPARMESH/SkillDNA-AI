import { AppError, HttpStatusCode, ApiErrorCode, PlatformType } from '@skilldna/shared';
import { ConnectPlatformDto } from '../dto/connect-platform.dto';
import { DisconnectPlatformDto } from '../dto/disconnect-platform.dto';
import { SyncRequestDto } from '../dto/sync-request.dto';
import { INTEGRATION_CONSTANTS } from '../constants/integration.constants';

export function validateConnectPlatform(data: any): ConnectPlatformDto {
  if (!data || typeof data !== 'object') {
    throw new AppError(
      'Invalid request payload.',
      HttpStatusCode.BAD_REQUEST,
      ApiErrorCode.INVALID_INPUT,
    );
  }

  const { platform, username, accessToken, refreshToken, metadata } = data;

  if (!platform || !INTEGRATION_CONSTANTS.SUPPORTED_PLATFORMS.includes(platform as PlatformType)) {
    throw new AppError(
      `Invalid or unsupported platform '${platform}'. Supported platforms: ${INTEGRATION_CONSTANTS.SUPPORTED_PLATFORMS.join(', ')}`,
      HttpStatusCode.BAD_REQUEST,
      ApiErrorCode.INVALID_INPUT,
    );
  }

  if (!username || typeof username !== 'string' || !username.trim()) {
    throw new AppError(
      'Username is required and must be a valid string.',
      HttpStatusCode.BAD_REQUEST,
      ApiErrorCode.INVALID_INPUT,
    );
  }

  return {
    platform: platform as PlatformType,
    username: username.trim(),
    accessToken: accessToken && typeof accessToken === 'string' ? accessToken.trim() : undefined,
    refreshToken:
      refreshToken && typeof refreshToken === 'string' ? refreshToken.trim() : undefined,
    metadata: metadata && typeof metadata === 'object' ? metadata : undefined,
  };
}

export function validateDisconnectPlatform(data: any): DisconnectPlatformDto {
  if (!data || typeof data !== 'object') {
    throw new AppError(
      'Invalid request payload.',
      HttpStatusCode.BAD_REQUEST,
      ApiErrorCode.INVALID_INPUT,
    );
  }

  const { platform } = data;

  if (!platform || !INTEGRATION_CONSTANTS.SUPPORTED_PLATFORMS.includes(platform as PlatformType)) {
    throw new AppError(
      `Invalid or unsupported platform '${platform}'.`,
      HttpStatusCode.BAD_REQUEST,
      ApiErrorCode.INVALID_INPUT,
    );
  }

  return {
    platform: platform as PlatformType,
  };
}

export function validateSyncRequest(data: any): SyncRequestDto {
  if (!data || typeof data !== 'object') {
    return { mode: 'INCREMENTAL', force: false };
  }

  const { platform, mode, force } = data;

  if (platform && !INTEGRATION_CONSTANTS.SUPPORTED_PLATFORMS.includes(platform as PlatformType)) {
    throw new AppError(
      `Invalid platform '${platform}'.`,
      HttpStatusCode.BAD_REQUEST,
      ApiErrorCode.INVALID_INPUT,
    );
  }

  const validModes = ['FULL', 'INCREMENTAL'];
  const syncMode =
    mode && validModes.includes(String(mode).toUpperCase())
      ? (String(mode).toUpperCase() as 'FULL' | 'INCREMENTAL')
      : 'INCREMENTAL';

  return {
    platform: platform ? (platform as PlatformType) : undefined,
    mode: syncMode,
    force: Boolean(force),
  };
}
