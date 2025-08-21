import { Container } from 'inversify';
import { types } from '@typegoose/typegoose';
import { RentOfferService } from './rent-offer.service.interface.js';
import { Component } from '../../types/index.js';
import { DefaultRentOfferService } from './rent-offer.service.js';
import { RentOfferCacheService } from './rent-offer-cache.service.js';
import { RentOfferEntity, RentOfferModel } from './rent-offer.entity.js';
import RentOfferController from './rent-offer.controller.js';
import { Controller } from '../../libs/rest/index.js';

export function createRentOfferContainer() {
  const rentOfferContainer = new Container();

  rentOfferContainer
    .bind<RentOfferCacheService>(Component.RentOfferCacheService)
    .to(RentOfferCacheService)
    .inSingletonScope();

  rentOfferContainer
    .bind<RentOfferService>(Component.RentOfferService)
    .to(DefaultRentOfferService);
  rentOfferContainer
    .bind<types.ModelType<RentOfferEntity>>(Component.RentOfferModel)
    .toConstantValue(RentOfferModel);
  rentOfferContainer
    .bind<Controller>(Component.RentOfferController)
    .to(RentOfferController);

  return rentOfferContainer;
}
