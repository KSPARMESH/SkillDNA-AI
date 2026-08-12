import { PlatformType } from '@skilldna/shared';
import { SyncMode } from '../types/integration.types';

export interface SyncRequestDto {
  platform?: PlatformType;
  mode?: SyncMode;
  force?: boolean;
}
