import { types } from '@typegoose/typegoose';
import { Container } from 'inversify';
import { Component } from '../../types/index.js';
import { FavoriteService } from './favorite.service.interface.js';
import { DefaultFavoriteService } from './favorite.service.js';
import { FavoriteEntity, FavoriteModel } from './favorite.entity.js';
import FavoriteController from './favorite.controller.js';
import { Controller } from '../../libs/rest/index.js';

export function createFavoriteContainer() {
  const container = new Container();
  container
    .bind<types.ModelType<FavoriteEntity>>(Component.FavoriteModel)
    .toConstantValue(FavoriteModel);
  container
    .bind<FavoriteService>(Component.FavoriteService)
    .to(DefaultFavoriteService)
    .inSingletonScope();

  container
    .bind<Controller>(Component.FavoriteController)
    .to(FavoriteController)
    .inSingletonScope();

  return container;
}
