import { inject, injectable } from 'inversify';
import { RentOfferService } from './rent-offer.service.interface.js';
import { Component, SortType } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { DocumentType, types } from '@typegoose/typegoose';
import { RentOfferEntity } from './rent-offer.entity.js';
import { CreateRentOfferDto } from './dto/create-rent-offer.dto.js';
import { UpdateRentOfferDto } from './dto/update-rent-offer.dto.js';
import { DEFAULT_OFFER_COUNT } from './rent-offer.constants.js';
import { CityEntity } from '../city/city.entity.js';
import { HttpError } from '../../libs/rest/index.js';
import { StatusCodes } from 'http-status-codes';
import { RentOfferCacheService } from './rent-offer-cache.service.js';

@injectable()
export class DefaultRentOfferService implements RentOfferService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.RentOfferModel)
    private readonly rentOfferModel: types.ModelType<RentOfferEntity>,
    @inject(Component.CityModel)
    private readonly cityModel: types.ModelType<CityEntity>,
    @inject(Component.RentOfferCacheService)
    private readonly cacheService: RentOfferCacheService
  ) {}

  public async create(
    dto: CreateRentOfferDto
  ): Promise<DocumentType<RentOfferEntity>> {
    const foundCity = await this.cityModel.exists({
      _id: dto.cityId
    });

    if (!foundCity) {
      throw new HttpError(
        StatusCodes.BAD_REQUEST,
        'The city does not exist',
        'DefaultRentOfferService'
      );
    }

    const result = await this.rentOfferModel.create(dto);
    this.logger.info(`New rent offer created: ${dto.title}`);

    // Invalidate relevant caches
    await this.cacheService.invalidateOfferCaches(dto.cityId);
    await this.cacheService.invalidateListCaches();

    return result;
  }

  public async find(count?: number): Promise<DocumentType<RentOfferEntity>[]> {
    const limit = count ?? DEFAULT_OFFER_COUNT;
    const cacheKey = this.cacheService.getListCacheKey(limit);

    const cachedOffers =
      await this.cacheService.get<DocumentType<RentOfferEntity>[]>(cacheKey);

    if (cachedOffers) {
      this.cacheService.logCacheHit('Rent offers list', `${limit} offers`);
      return cachedOffers;
    }

    const offers = await this.rentOfferModel
      .find()
      .sort({ createdAt: SortType.Down })
      .populate(['userId', 'cityId'])
      .limit(limit)
      .exec();

    // Cache the result
    await this.cacheService.set(cacheKey, offers);
    this.cacheService.logCacheStorage('Rent offers list', `${limit} offers`);

    return offers;
  }

  public async findById(
    rentOfferId: string
  ): Promise<DocumentType<RentOfferEntity> | null> {
    const cacheKey = this.cacheService.getIndividualCacheKey(rentOfferId);

    const cachedOffer =
      await this.cacheService.get<DocumentType<RentOfferEntity>>(cacheKey);

    if (cachedOffer) {
      this.cacheService.logCacheHit('Rent offer', rentOfferId);
      return cachedOffer;
    }

    const offer = await this.rentOfferModel
      .findById(rentOfferId)
      .populate(['userId', 'cityId'])
      .exec();

    if (offer) {
      await this.cacheService.set(cacheKey, offer.toObject());
      this.cacheService.logCacheStorage('Rent offer', rentOfferId);
    }

    return offer;
  }

  public async deleteById(
    rentOfferId: string
  ): Promise<DocumentType<RentOfferEntity> | null> {
    const offer = await this.rentOfferModel.findById(rentOfferId).exec();

    if (offer) {
      // Invalidate relevant caches before deletion
      await this.cacheService.invalidateOfferCaches(offer.cityId.toString());
      await this.cacheService.invalidateListCaches();
      await this.cacheService.invalidateIndividualOffer(rentOfferId);
    }

    return this.rentOfferModel.findByIdAndDelete(rentOfferId).exec();
  }

  public async updateById(
    rentOfferId: string,
    dto: UpdateRentOfferDto
  ): Promise<DocumentType<RentOfferEntity> | null> {
    if (dto.cityId) {
      const foundCity = await this.cityModel.exists({
        _id: dto.cityId
      });

      if (!foundCity) {
        throw new HttpError(
          StatusCodes.BAD_REQUEST,
          'The city does not exist',
          'DefaultRentOfferService'
        );
      }
    }

    const result = await this.rentOfferModel
      .findByIdAndUpdate(rentOfferId, dto, { new: true })
      .populate(['userId', 'cityId'])
      .exec();

    if (result) {
      // Invalidate relevant caches
      await this.cacheService.invalidateOfferCaches(result.cityId.toString());
      await this.cacheService.invalidateListCaches();
      await this.cacheService.invalidateIndividualOffer(rentOfferId);
    }

    return result;
  }

  public async findByCityId(
    cityId: string,
    count?: number
  ): Promise<DocumentType<RentOfferEntity>[]> {
    const limit = count ?? DEFAULT_OFFER_COUNT;
    const cacheKey = this.cacheService.getCityCacheKey(cityId, limit);

    const cachedOffers =
      await this.cacheService.get<DocumentType<RentOfferEntity>[]>(cacheKey);

    if (cachedOffers) {
      this.cacheService.logCacheHit('City offers', `${cityId} (${limit})`);
      return cachedOffers;
    }

    const offers = await this.rentOfferModel
      .find({ cityId: cityId }, {}, { limit })
      .sort({ createdAt: SortType.Down })
      .populate(['userId', 'cityId'])
      .exec();

    await this.cacheService.set(cacheKey, offers);
    this.cacheService.logCacheStorage('City offers', `${cityId} (${limit})`);

    return offers;
  }

  public async findPremiumByCityId(
    cityId: string,
    count?: number
  ): Promise<DocumentType<RentOfferEntity>[]> {
    const limit = count ?? DEFAULT_OFFER_COUNT;
    const cacheKey = this.cacheService.getPremiumCacheKey(cityId, limit);

    const cachedOffers =
      await this.cacheService.get<DocumentType<RentOfferEntity>[]>(cacheKey);

    if (cachedOffers) {
      this.cacheService.logCacheHit('Premium offers', `${cityId} (${limit})`);
      return cachedOffers;
    }

    const offers = await this.rentOfferModel
      .find({ cityId: cityId, isPremium: true }, {}, { limit })
      .sort({ createdAt: SortType.Down })
      .populate(['cityId'])
      .exec();

    await this.cacheService.set(cacheKey, offers);
    this.cacheService.logCacheStorage('Premium offers', `${cityId} (${limit})`);

    return offers;
  }

  public async exists(documentId: string): Promise<boolean> {
    return (await this.rentOfferModel.exists({ _id: documentId })) !== null;
  }

  public async incCommentCount(
    rentOfferId: string
  ): Promise<DocumentType<RentOfferEntity> | null> {
    const result = await this.rentOfferModel
      .findByIdAndUpdate(rentOfferId, {
        $inc: {
          commentCount: 1
        }
      })
      .exec();

    if (result) {
      // Invalidate caches that depend on comment count
      await this.cacheService.invalidateListCaches();
      await this.cacheService.invalidateIndividualOffer(rentOfferId);
    }

    return result;
  }

  public async findNew(
    count: number
  ): Promise<DocumentType<RentOfferEntity>[]> {
    const cacheKey = this.cacheService.getNewCacheKey(count);

    const cachedOffers =
      await this.cacheService.get<DocumentType<RentOfferEntity>[]>(cacheKey);

    if (cachedOffers) {
      this.cacheService.logCacheHit('New offers', `${count} offers`);
      return cachedOffers;
    }

    const offers = await this.rentOfferModel
      .find()
      .sort({ createdAt: SortType.Down })
      .limit(count)
      .populate(['userId', 'cityId'])
      .exec();

    await this.cacheService.set(cacheKey, offers);
    this.cacheService.logCacheStorage('New offers', `${count} offers`);

    return offers;
  }

  public async findDiscussed(
    count: number
  ): Promise<DocumentType<RentOfferEntity>[]> {
    const cacheKey = this.cacheService.getDiscussedCacheKey(count);

    const cachedOffers =
      await this.cacheService.get<DocumentType<RentOfferEntity>[]>(cacheKey);

    if (cachedOffers) {
      this.cacheService.logCacheHit('Discussed offers', `${count} offers`);
      return cachedOffers;
    }

    const offers = await this.rentOfferModel
      .find()
      .sort({ commentCount: SortType.Down })
      .limit(count)
      .populate(['userId', 'cityId'])
      .exec();

    await this.cacheService.set(cacheKey, offers);
    this.cacheService.logCacheStorage('Discussed offers', `${count} offers`);

    return offers;
  }
}
