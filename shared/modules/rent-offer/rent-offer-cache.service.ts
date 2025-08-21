import { inject, injectable } from 'inversify';
import { Component } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { CacheService } from '../../libs/cache/index.js';
import { Config, RestSchema } from '../../libs/config/index.js';
import { DEFAULT_OFFER_COUNT } from './rent-offer.constants.js';

@injectable()
export class RentOfferCacheService {
  private readonly CACHE_TTL: number;
  private readonly RENT_OFFERS_LIST_KEY = 'rent-offers:list';
  private readonly RENT_OFFERS_CITY_KEY = 'rent-offers:city';
  private readonly RENT_OFFERS_PREMIUM_KEY = 'rent-offers:premium';
  private readonly RENT_OFFERS_NEW_KEY = 'rent-offers:new';
  private readonly RENT_OFFERS_DISCUSSED_KEY = 'rent-offers:discussed';
  private readonly RENT_OFFER_INDIVIDUAL_KEY = 'rent-offer:individual';

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.CacheService)
    private readonly cacheService: CacheService,
    @inject(Component.Config) private readonly config: Config<RestSchema>
  ) {
    const configuredTtl = this.config.get('CACHE_TTL_RENT_OFFERS');
    this.CACHE_TTL = typeof configuredTtl === 'number' ? configuredTtl : 1800; // 30 minutes default
  }

  /**
   * Generate cache key for rent offer list
   */
  public getListCacheKey(limit?: number): string {
    const limitValue = limit ?? DEFAULT_OFFER_COUNT;
    return this.cacheService.generateKey(
      this.RENT_OFFERS_LIST_KEY,
      limitValue.toString()
    );
  }

  /**
   * Generate cache key for individual rent offer
   */
  public getIndividualCacheKey(rentOfferId: string): string {
    return this.cacheService.generateKey(
      this.RENT_OFFER_INDIVIDUAL_KEY,
      rentOfferId
    );
  }

  /**
   * Generate cache key for city-specific offers
   */
  public getCityCacheKey(cityId: string, limit?: number): string {
    const limitValue = limit ?? DEFAULT_OFFER_COUNT;
    return this.cacheService.generateKey(
      this.RENT_OFFERS_CITY_KEY,
      cityId,
      limitValue.toString()
    );
  }

  /**
   * Generate cache key for premium offers by city
   */
  public getPremiumCacheKey(cityId: string, limit?: number): string {
    const limitValue = limit ?? DEFAULT_OFFER_COUNT;
    return this.cacheService.generateKey(
      this.RENT_OFFERS_PREMIUM_KEY,
      cityId,
      limitValue.toString()
    );
  }

  /**
   * Generate cache key for new offers
   */
  public getNewCacheKey(count: number): string {
    return this.cacheService.generateKey(
      this.RENT_OFFERS_NEW_KEY,
      count.toString()
    );
  }

  /**
   * Generate cache key for discussed offers
   */
  public getDiscussedCacheKey(count: number): string {
    return this.cacheService.generateKey(
      this.RENT_OFFERS_DISCUSSED_KEY,
      count.toString()
    );
  }

  /**
   * Get cached data
   */
  public async get<T>(key: string): Promise<T | null> {
    return this.cacheService.get<T>(key);
  }

  /**
   * Set cached data
   */
  public async set<T>(key: string, value: T): Promise<void> {
    await this.cacheService.set(key, value, this.CACHE_TTL);
  }

  /**
   * Delete cached data
   */
  public async delete(key: string): Promise<void> {
    await this.cacheService.delete(key);
  }

  /**
   * Get cache TTL
   */
  public getTTL(): number {
    return this.CACHE_TTL;
  }

  /**
   * Invalidate all list-related caches
   */
  public async invalidateListCaches(): Promise<void> {
    try {
      const keysToDelete = [
        this.RENT_OFFERS_LIST_KEY,
        this.RENT_OFFERS_NEW_KEY,
        this.RENT_OFFERS_DISCUSSED_KEY
      ];

      for (const key of keysToDelete) {
        // Delete all variations of the key (with different limits)
        await this.cacheService.delete(key);
        // Also delete specific limit variations
        for (const limit of [DEFAULT_OFFER_COUNT, 10, 20, 50, 100]) {
          await this.cacheService.delete(
            this.cacheService.generateKey(key, limit.toString())
          );
        }
      }

      this.logger.info('Rent offer list caches invalidated');
    } catch (error) {
      this.logger.error('Failed to invalidate list caches:', error as Error);
    }
  }

  /**
   * Invalidate city-specific offer caches
   */
  public async invalidateOfferCaches(cityId: string): Promise<void> {
    try {
      const keysToDelete = [
        this.RENT_OFFERS_CITY_KEY,
        this.RENT_OFFERS_PREMIUM_KEY
      ];

      for (const key of keysToDelete) {
        // Delete all variations of the city key (with different limits)
        await this.cacheService.delete(
          this.cacheService.generateKey(key, cityId)
        );
        // Also delete specific limit variations
        for (const limit of [DEFAULT_OFFER_COUNT, 10, 20, 50, 100]) {
          await this.cacheService.delete(
            this.cacheService.generateKey(key, cityId, limit.toString())
          );
        }
      }

      this.logger.info(`City ${cityId} offer caches invalidated`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate city ${cityId} offer caches:`,
        error as Error
      );
    }
  }

  /**
   * Invalidate individual offer cache
   */
  public async invalidateIndividualOffer(rentOfferId: string): Promise<void> {
    try {
      await this.cacheService.delete(this.getIndividualCacheKey(rentOfferId));
      this.logger.info(`Individual offer ${rentOfferId} cache invalidated`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate individual offer ${rentOfferId} cache:`,
        error as Error
      );
    }
  }

  /**
   * Log cache hit
   */
  public logCacheHit(operation: string, details: string): void {
    this.logger.info(`${operation} retrieved from cache: ${details}`);
  }

  /**
   * Log cache miss and storage
   */
  public logCacheStorage(operation: string, details: string): void {
    this.logger.info(
      `${operation} cached for ${this.CACHE_TTL} seconds: ${details}`
    );
  }
}
