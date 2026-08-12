import {
  NormalizedGitHubData,
  NormalizedCodingData,
  NormalizedLinkedInData,
  NormalizedMediumData,
  NormalizedStackOverflowData,
  NormalizedDevpostData,
  NormalizedKaggleData,
  NormalizedPlatformResult,
} from '../types/integration.types';
import { IPlatformAdapter } from '../interfaces/integration.interface';

export {
  NormalizedGitHubData,
  NormalizedCodingData,
  NormalizedLinkedInData,
  NormalizedMediumData,
  NormalizedStackOverflowData,
  NormalizedDevpostData,
  NormalizedKaggleData,
  NormalizedPlatformResult,
  IPlatformAdapter,
};

export abstract class BasePlatformAdapter implements IPlatformAdapter {
  abstract readonly platformName: string;

  async validateCredentials(username: string, accessToken?: string): Promise<boolean> {
    if (!username || typeof username !== 'string' || !username.trim()) {
      return false;
    }
    return true;
  }

  abstract fetchData(username: string, accessToken?: string): Promise<NormalizedPlatformResult>;

  protected sanitizeUsername(username: string): string {
    return username.trim().replace(/^@/, '');
  }
}
