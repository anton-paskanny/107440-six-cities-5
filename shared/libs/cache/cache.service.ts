import { inject, injectable } from 'inversify';
import { CacheService } from './cache.service.interface.js';
import { RedisClient } from './redis-client.interface.js';
import { Component } from '../../types/index.js';
import { Logger } from '../logger/index.js';

@injectable()
export class DefaultCacheService implements CacheService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.RedisClient) private readonly redisClient: RedisClient
  ) {}

  public async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(
        `Failed to get cached value for key ${key}:`,
        error as Error
      );
      return null;
    }
  }

  public async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redisClient.set(key, serializedValue, ttlSeconds);
      this.logger.debug(
        `Cached value for key ${key} with TTL ${ttlSeconds || 'none'}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to cache value for key ${key}:`,
        error as Error
      );
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
      this.logger.debug(`Deleted cached value for key ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete cached value for key ${key}:`,
        error as Error
      );
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Failed to check existence for key ${key}:`,
        error as Error
      );
      return false;
    }
  }

  public async clear(): Promise<void> {
    try {
      try {
        await this.redisClient.flushdb();
        this.logger.info('Cache cleared');
      } catch (error) {
        this.logger.error('Failed to clear cache:', error as Error);
      }
    } catch (error) {
      this.logger.error('Failed to clear cache:', error as Error);
    }
  }

  public generateKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}
