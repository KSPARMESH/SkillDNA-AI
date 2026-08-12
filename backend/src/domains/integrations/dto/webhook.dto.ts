import { PlatformType } from '@skilldna/shared';

export interface WebhookDto {
  platform: PlatformType;
  event: string;
  payload: Record<string, any>;
  signature?: string;
}
