import { inject, injectable } from 'inversify';
import { Redis } from 'ioredis';
import { RedisClient } from './redis-client.interface.js';
import { Component } from '../../types/index.js';
import { Logger } from '../logger/index.js';
import { Config, RestSchema } from '../config/index.js';

@injectable()
export class DefaultRedisClient implements RedisClient {
  private redis: Redis | null = null;
  private isConnectedFlag = false;

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config<RestSchema>
  ) {}

  public async connect(): Promise<void> {
    try {
      this.redis = new Redis({
        host: this.config.get('REDIS_HOST'),
        port: this.config.get('REDIS_PORT'),
        password: this.config.get('REDIS_PASSWORD') || undefined,
        db: this.config.get('REDIS_DB'),
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      if (this.redis) {
        this.redis.on('connect', () => {
          this.logger.info('Redis client connected');
          this.isConnectedFlag = true;
        });

        this.redis.on('error', (error: Error) => {
          this.logger.error('Redis client error:', error);
          this.isConnectedFlag = false;
        });

        this.redis.on('close', () => {
          this.logger.info('Redis client disconnected');
          this.isConnectedFlag = false;
        });

        await this.redis.connect();
      }
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error as Error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
      this.redis = null;
      this.isConnectedFlag = false;
    }
  }

  public async get(key: string): Promise<string | null> {
    if (!this.redis || !this.isConnectedFlag) {
      return null;
    }
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error as Error);
      return null;
    }
  }

  public async set(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<void> {
    if (!this.redis || !this.isConnectedFlag) {
      return;
    }
    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Failed to set key ${key}:`, error as Error);
    }
  }

  public async del(key: string): Promise<number> {
    if (!this.redis || !this.isConnectedFlag) {
      return 0;
    }
    try {
      return await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}:`, error as Error);
      return 0;
    }
  }

  public async exists(key: string): Promise<number> {
    if (!this.redis || !this.isConnectedFlag) {
      return 0;
    }
    try {
      return await this.redis.exists(key);
    } catch (error) {
      this.logger.error(
        `Failed to check existence of key ${key}:`,
        error as Error
      );
      return 0;
    }
  }

  public async expire(key: string, ttlSeconds: number): Promise<number> {
    if (!this.redis || !this.isConnectedFlag) {
      return 0;
    }
    try {
      return await this.redis.expire(key, ttlSeconds);
    } catch (error) {
      this.logger.error(`Failed to set expiry for key ${key}:`, error as Error);
      return 0;
    }
  }

  public async flushdb(): Promise<void> {
    if (!this.redis || !this.isConnectedFlag) {
      return;
    }
    try {
      await this.redis.flushdb();
    } catch (error) {
      this.logger.error('Failed to flush Redis database:', error as Error);
    }
  }

  public isConnected(): boolean {
    return this.isConnectedFlag;
  }

  public getRedisInstance(): Redis | null {
    return this.redis;
  }
}
