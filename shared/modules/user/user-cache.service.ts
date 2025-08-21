import { inject, injectable } from 'inversify';
import { Component } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { CacheService } from '../../libs/cache/index.js';
import { Config, RestSchema } from '../../libs/config/index.js';

@injectable()
export class UserCacheService {
  private readonly CACHE_TTL: number;
  private readonly USER_PROFILE_KEY = 'user:profile';
  private readonly USER_AVATAR_KEY = 'user:avatar';
  private readonly USER_EXISTS_KEY = 'user:exists';

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.CacheService) private readonly cacheService: CacheService,
    @inject(Component.Config) private readonly config: Config<RestSchema>
  ) {
    const configuredTtl = this.config.get('CACHE_TTL_USERS');
    this.CACHE_TTL = typeof configuredTtl === 'number' ? configuredTtl : 7200;
  }

  // Keys
  public getProfileKey(userId: string): string {
    return this.cacheService.generateKey(this.USER_PROFILE_KEY, userId);
  }

  public getProfileByEmailKey(email: string): string {
    return this.cacheService.generateKey(this.USER_PROFILE_KEY, 'email', email);
  }

  public getAvatarKey(userId: string): string {
    return this.cacheService.generateKey(this.USER_AVATAR_KEY, userId);
  }

  public getExistsKey(userId: string): string {
    return this.cacheService.generateKey(this.USER_EXISTS_KEY, userId);
  }

  // Logging
  public logHit(op: string, key: string): void {
    this.logger.info(`${op} retrieved from cache: ${key}`);
  }

  public logSet(op: string, key: string): void {
    this.logger.info(`${op} cached for ${this.CACHE_TTL} seconds: ${key}`);
  }

  // TTL writes
  public async setWithTtl<T>(
    key: string,
    value: T,
    ttl: number = this.CACHE_TTL
  ): Promise<void> {
    await this.cacheService.set(key, value, ttl);
  }

  // Convenience read
  public async get<T>(key: string): Promise<T | null> {
    return this.cacheService.get<T>(key);
  }

  // Invalidation helpers
  public async invalidateProfile(userId: string): Promise<void> {
    await this.cacheService.delete(this.getProfileKey(userId));
  }

  public async invalidateAvatar(userId: string): Promise<void> {
    await this.cacheService.delete(this.getAvatarKey(userId));
  }

  public async invalidateExists(userId: string): Promise<void> {
    await this.cacheService.delete(this.getExistsKey(userId));
  }

  public async invalidateByEmail(email: string): Promise<void> {
    await this.cacheService.delete(this.getProfileByEmailKey(email));
  }
}
