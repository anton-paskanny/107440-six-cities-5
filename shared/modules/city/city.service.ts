import { CityService } from './city.service.interface.js';
import { inject, injectable } from 'inversify';
import { Component, SortType } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { DocumentType, types } from '@typegoose/typegoose';
import { CityEntity } from './city.entity.js';
import { MAX_CITIES_COUNT } from './city.constants.js';
import { CreateCityDto } from './dto/create-city.dto.js';
// Removed direct cache/config usage; delegated to CityCacheService
import { CityCacheService } from './city-cache.service.js';

@injectable()
export class DefaultCityService implements CityService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.CityModel)
    private readonly cityModel: types.ModelType<CityEntity>,
    @inject(Component.CityCacheService)
    private readonly cityCache: CityCacheService
  ) {}

  public async create(dto: CreateCityDto): Promise<DocumentType<CityEntity>> {
    const result = await this.cityModel.create(dto);
    this.logger.info(`New city created: ${dto.name}`);
    // Invalidate city list cache when a new city is created
    await this.cityCache.invalidateList();
    return result;
  }

  public async findByCityId(
    cityId: string
  ): Promise<DocumentType<CityEntity> | null> {
    const cacheKey = this.cityCache.getByIdKey(cityId);

    const cachedCity =
      await this.cityCache.get<DocumentType<CityEntity>>(cacheKey);

    if (cachedCity) {
      this.cityCache.logCacheHit('City by id', cityId);
      return cachedCity;
    }

    const city = await this.cityModel.findById(cityId).exec();

    if (city) {
      // Store as plain object for safe JSON serialization
      await this.cityCache.setWithTtl(cacheKey, city.toObject());
      this.cityCache.logCacheStore('City by id', cityId);
    }

    return city;
  }

  public async findByCityName(
    cityName: string
  ): Promise<DocumentType<CityEntity> | null> {
    const cacheKey = this.cityCache.getByNameKey(cityName);

    const cachedCity =
      await this.cityCache.get<DocumentType<CityEntity>>(cacheKey);

    if (cachedCity) {
      this.cityCache.logCacheHit('City by name', cityName);
      return cachedCity;
    }

    const city = await this.cityModel.findOne({ name: cityName }).exec();

    if (city) {
      await this.cityCache.setWithTtl(cacheKey, city.toObject());
      this.cityCache.logCacheStore('City by name', cityName);
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
    const cachedCities = await this.cityCache.get<DocumentType<CityEntity>[]>(
      this.cityCache.getListKey()
    );

    if (cachedCities) {
      this.cityCache.logCacheHit('City list', 'all');
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

    await this.cityCache.setWithTtl(this.cityCache.getListKey(), cities);
    this.cityCache.logCacheStore('City list', 'all');

    return cities;
  }

  public async exists(documentId: string): Promise<boolean> {
    return (await this.cityModel.exists({ _id: documentId })) !== null;
  }
}
