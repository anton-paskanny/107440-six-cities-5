import { CityService } from './city.service.interface.js';
import { inject, injectable } from 'inversify';
import { Component, SortType } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { DocumentType, types } from '@typegoose/typegoose';
import { CityEntity } from './city.entity.js';
import { MAX_CITIES_COUNT } from './city.constants.js';
import { CreateCityDto } from './dto/create-city.dto.js';
import { CacheService } from '../../libs/cache/index.js';
import { Config, RestSchema } from '../../libs/config/index.js';

@injectable()
export class DefaultCityService implements CityService {
  private readonly CACHE_TTL: number;
  private readonly CITY_LIST_KEY = 'cities:list';
  private readonly CITY_INDIVIDUAL_KEY = 'city:individual';

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.CityModel)
    private readonly cityModel: types.ModelType<CityEntity>,
    @inject(Component.CacheService)
    private readonly cacheService: CacheService,
    @inject(Component.Config) private readonly config: Config<RestSchema>
  ) {
    const configuredTtl = this.config.get('CACHE_TTL_CITIES');
    this.CACHE_TTL = typeof configuredTtl === 'number' ? configuredTtl : 3600;
  }

  public async create(dto: CreateCityDto): Promise<DocumentType<CityEntity>> {
    const result = await this.cityModel.create(dto);
    this.logger.info(`New city created: ${dto.name}`);
    // Invalidate city list cache when a new city is created
    try {
      await this.cacheService.delete(this.CITY_LIST_KEY);
      this.logger.info('City list cache invalidated');
    } catch (error) {
      this.logger.error(
        'Failed to invalidate city list cache:',
        error as Error
      );
    }
    return result;
  }

  public async findByCityId(
    cityId: string
  ): Promise<DocumentType<CityEntity> | null> {
    const cacheKey = this.cacheService.generateKey(
      this.CITY_INDIVIDUAL_KEY,
      cityId
    );

    const cachedCity =
      await this.cacheService.get<DocumentType<CityEntity>>(cacheKey);

    if (cachedCity) {
      this.logger.info(`City ${cityId} retrieved from cache`);
      return cachedCity;
    }

    const city = await this.cityModel.findById(cityId).exec();

    if (city) {
      // Store as plain object for safe JSON serialization
      await this.cacheService.set(cacheKey, city.toObject(), this.CACHE_TTL);
      this.logger.info(`City ${cityId} cached for ${this.CACHE_TTL} seconds`);
    }

    return city;
  }

  public async findByCityName(
    cityName: string
  ): Promise<DocumentType<CityEntity> | null> {
    const cacheKey = this.cacheService.generateKey(
      this.CITY_INDIVIDUAL_KEY,
      'name',
      cityName
    );

    const cachedCity =
      await this.cacheService.get<DocumentType<CityEntity>>(cacheKey);

    if (cachedCity) {
      this.logger.info(`City ${cityName} retrieved from cache`);
      return cachedCity;
    }

    const city = await this.cityModel.findOne({ name: cityName }).exec();

    if (city) {
      await this.cacheService.set(cacheKey, city.toObject(), this.CACHE_TTL);
      this.logger.info(`City ${cityName} cached for ${this.CACHE_TTL} seconds`);
    }

    return city;
  }

  public async findByCityNameOrCreate(
    cityName: string,
    dto: CreateCityDto
  ): Promise<DocumentType<CityEntity>> {
    const existedCity = await this.findByCityName(cityName);

    if (existedCity) {
      return existedCity;
    }

    return this.create(dto);
  }

  public async find(): Promise<DocumentType<CityEntity>[]> {
    const cachedCities = await this.cacheService.get<
      DocumentType<CityEntity>[]
    >(this.CITY_LIST_KEY);

    if (cachedCities) {
      this.logger.info('City list retrieved from cache');
      return cachedCities;
    }

    const cities = await this.cityModel
      .aggregate([
        {
          $lookup: {
            from: 'rentOffers',
            let: { cityId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$cityId', '$$cityId'] // Filter rent offers based on cityId
                  }
                }
              },
              { $project: { _id: 1 } }
            ],
            as: 'rentOffers'
          }
        },
        {
          $addFields: {
            id: { $toString: '$_id' },
            rentOfferCount: { $size: '$rentOffers' }
          }
        },
        { $unset: 'rentOffers' },
        { $limit: MAX_CITIES_COUNT },
        { $sort: { rentOfferCount: SortType.Down } }
      ])
      .exec();

    await this.cacheService.set(this.CITY_LIST_KEY, cities, this.CACHE_TTL);
    this.logger.info(`City list cached for ${this.CACHE_TTL} seconds`);

    return cities;
  }

  public async exists(documentId: string): Promise<boolean> {
    return (await this.cityModel.exists({ _id: documentId })) !== null;
  }
}
