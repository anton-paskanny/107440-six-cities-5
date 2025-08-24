import type { Redis } from 'ioredis';

export interface RedisClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<number>;
  flushdb(): Promise<void>;
  isConnected(): boolean;
  getRedisInstance(): Redis | null; // Returns the underlying Redis instance for rate limiting
}
