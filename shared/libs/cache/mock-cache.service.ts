import { CacheService } from './cache.service.interface.js';

export class MockCacheService implements CacheService {
  async get<T>(): Promise<T | null> {
    return null;
  }

  async set(): Promise<void> {
    // Do nothing
  }

  async delete(): Promise<void> {
    // Do nothing
  }

  async exists(): Promise<boolean> {
    return false;
  }

  async clear(): Promise<void> {
    // Do nothing
  }

  generateKey(prefix: string, ...parts: string[]): string {
    return [prefix, ...parts].join(':');
  }
}
