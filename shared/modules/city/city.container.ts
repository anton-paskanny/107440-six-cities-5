import { Container } from 'inversify';
import { types } from '@typegoose/typegoose';
import { Component } from '../../types/index.js';
import { Controller } from '../../libs/rest/index.js';
import { CityController } from './city.controller.js';
import { CityService } from './city.service.interface.js';
import { DefaultCityService } from './city.service.js';
import { CityEntity, CityModel } from './city.entity.js';
import { CityCacheService } from './city-cache.service.js';

export function createCityContainer() {
  const cityContainer = new Container();

  cityContainer
    .bind<CityCacheService>(Component.CityCacheService)
    .to(CityCacheService)
    .inSingletonScope();

  cityContainer.bind<CityService>(Component.CityService).to(DefaultCityService);
  cityContainer
    .bind<types.ModelType<CityEntity>>(Component.CityModel)
    .toConstantValue(CityModel);
  cityContainer
    .bind<Controller>(Component.CityController)
    .to(CityController)
    .inSingletonScope();

  return cityContainer;
}
