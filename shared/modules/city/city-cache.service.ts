import { inject, injectable } from 'inversify';
import { Component } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { CacheService } from '../../libs/cache/index.js';
import { Config, RestSchema } from '../../libs/config/index.js';

@injectable()
export class CityCacheService {
  private readonly CACHE_TTL: number;
  private readonly CITY_LIST_KEY = 'cities:list';
  private readonly CITY_INDIVIDUAL_KEY = 'city:individual';

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.CacheService) private readonly cacheService: CacheService,
    @inject(Component.Config) private readonly config: Config<RestSchema>
  ) {
    const configuredTtl = this.config.get('CACHE_TTL_CITIES');
    this.CACHE_TTL = typeof configuredTtl === 'number' ? configuredTtl : 3600;
  }

  public getListKey(): string {
    return this.CITY_LIST_KEY;
  }

  public getByIdKey(cityId: string): string {
    return this.cacheService.generateKey(this.CITY_INDIVIDUAL_KEY, cityId);
  }

  public getByNameKey(cityName: string): string {
    return this.cacheService.generateKey(
      this.CITY_INDIVIDUAL_KEY,
      'name',
      cityName
    );
  }

  // Domain logging helpers
  public logCacheHit(entity: string, key: string): void {
    this.logger.info(`${entity} retrieved from cache: ${key}`);
  }

  public logCacheStore(entity: string, key: string): void {
    this.logger.info(`${entity} cached for ${this.CACHE_TTL} seconds: ${key}`);
  }

  // Invalidation helpers
  public async invalidateList(): Promise<void> {
    try {
      await this.cacheService.delete(this.CITY_LIST_KEY);
      this.logger.info('City list cache invalidated');
    } catch (error) {
      this.logger.error(
        'Failed to invalidate city list cache:',
        error as Error
      );
    }
  }

  public async invalidateById(cityId: string): Promise<void> {
    try {
      await this.cacheService.delete(this.getByIdKey(cityId));
      this.logger.info(`City ${cityId} cache invalidated`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate city ${cityId} cache:`,
        error as Error
      );
    }
  }

  public async invalidateByName(cityName: string): Promise<void> {
    try {
      await this.cacheService.delete(this.getByNameKey(cityName));
      this.logger.info(`City ${cityName} cache invalidated`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate city ${cityName} cache:`,
        error as Error
      );
    }
  }

  // Centralized TTL write helper (delegates to base cache)
  public async setWithTtl<T>(key: string, value: T): Promise<void> {
    await this.cacheService.set(key, value, this.CACHE_TTL);
  }

  // Expose read via base cache (optional convenience)
  public async get<T>(key: string): Promise<T | null> {
    return this.cacheService.get<T>(key);
  }
}
