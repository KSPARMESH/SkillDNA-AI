import {
  AppError,
  HttpStatusCode,
  ApiErrorCode,
  PlatformType,
  normalizePlatformType,
} from '@skilldna/shared';
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
  const normalizedPlatform = normalizePlatformType(platform);

  if (
    !normalizedPlatform ||
    !INTEGRATION_CONSTANTS.SUPPORTED_PLATFORMS.includes(normalizedPlatform)
  ) {
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
    platform: normalizedPlatform,
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
  const normalizedPlatform = normalizePlatformType(platform);

  if (
    !normalizedPlatform ||
    !INTEGRATION_CONSTANTS.SUPPORTED_PLATFORMS.includes(normalizedPlatform)
  ) {
    throw new AppError(
      `Invalid or unsupported platform '${platform}'.`,
      HttpStatusCode.BAD_REQUEST,
      ApiErrorCode.INVALID_INPUT,
    );
  }

  return {
    platform: normalizedPlatform,
  };
}

export function validateSyncRequest(data: any): SyncRequestDto {
  if (!data || typeof data !== 'object') {
    return { mode: 'INCREMENTAL', force: false };
  }

  const { platform, mode, force } = data;
  const normalizedPlatform = platform ? normalizePlatformType(platform) : undefined;

  if (
    platform &&
    (!normalizedPlatform || !INTEGRATION_CONSTANTS.SUPPORTED_PLATFORMS.includes(normalizedPlatform))
  ) {
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
    platform: normalizedPlatform || undefined,
    mode: syncMode,
    force: Boolean(force),
  };
}
