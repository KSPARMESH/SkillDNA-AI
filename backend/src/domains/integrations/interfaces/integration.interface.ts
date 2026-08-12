import { PlatformType } from '@skilldna/shared';
import {
  NormalizedPlatformResult,
  SyncMode,
  SyncStatus,
  WebhookSource,
} from '../types/integration.types';

export interface IPlatformAdapter {
  readonly platformName: string;
  validateCredentials(username: string, accessToken?: string): Promise<boolean>;
  fetchData(username: string, accessToken?: string): Promise<NormalizedPlatformResult>;
  refreshToken?(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }>;
}

export interface ISyncOptions {
  mode?: SyncMode;
  force?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export interface ISyncResult {
  integrationId: string;
  platform: PlatformType;
  status: SyncStatus;
  recordsProcessed: number;
  syncedAt: Date;
  error?: string;
  limitation?: string;
  data?: NormalizedPlatformResult;
}

export interface IOAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
}

export interface IOAuthAuthUrlOptions {
  platform: PlatformType;
  redirectUri: string;
  state?: string;
  scope?: string[];
}

export interface IWebhookEvent {
  id: string;
  source: WebhookSource;
  event: string;
  payload: Record<string, any>;
  signature?: string;
  receivedAt: Date;
}

export interface IWebhookValidationResult {
  isValid: boolean;
  error?: string;
}

export interface IScheduledJobConfig {
  cronExpression: string;
  platform?: PlatformType;
  batchSize?: number;
  enabled: boolean;
}

export interface ISyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncDurationMs: number;
  averageDurationMs: number;
}
