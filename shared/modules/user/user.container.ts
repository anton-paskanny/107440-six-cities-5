import { types } from '@typegoose/typegoose';
import { Container } from 'inversify';
import { UserService } from './user.service.interface.js';
import { Component } from '../../types/index.js';
import { DefaultUserService } from './user.service.js';
import { UserCacheService } from './user-cache.service.js';
import { UserEntity, UserModel } from './user.entity.js';
import { UserController } from './user.controller.js';
import { Controller } from '../../libs/rest/index.js';

export function createUserContainer() {
  const userContainer = new Container();
  userContainer
    .bind<UserCacheService>(Component.UserCacheService)
    .to(UserCacheService)
    .inSingletonScope();
  userContainer
    .bind<UserService>(Component.UserService)
    .to(DefaultUserService)
    .inSingletonScope();
  userContainer
    .bind<types.ModelType<UserEntity>>(Component.UserModel)
    .toConstantValue(UserModel);
  userContainer
    .bind<Controller>(Component.UserController)
    .to(UserController)
    .inSingletonScope();

  return userContainer;
}
