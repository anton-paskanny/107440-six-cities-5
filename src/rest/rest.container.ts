import { Container } from 'inversify';
import { RestApplication } from './rest.application.js';
import { Component } from '../../shared/types/index.js';
import { Logger, PinoLogger } from '../../shared/libs/logger/index.js';
import {
  Config,
  RestConfig,
  RestSchema
} from '../../shared/libs/config/index.js';
import {
  DatabaseClient,
  MongoDatabaseClient
} from '../../shared/libs/database-client/index.js';
import {
  RedisClient,
  DefaultRedisClient
} from '../../shared/libs/cache/index.js';
import {
  AppExceptionFilter,
  ExceptionFilter,
  ValidationExceptionFilter,
  HttpErrorExceptionFilter
} from '../../shared/libs/rest/index.js';
import { PathTransformer } from '../../shared/libs/rest/transform/path.transformer.js';
import {
  CacheService,
  DefaultCacheService
} from '../../shared/libs/cache/index.js';

export function createRestApplicationContainer() {
  const restApplicationContainer = new Container();

  restApplicationContainer
    .bind<RestApplication>(Component.RestApplication)
    .to(RestApplication)
    .inSingletonScope();
  restApplicationContainer
    .bind<Logger>(Component.Logger)
    .to(PinoLogger)
    .inSingletonScope();
  restApplicationContainer
    .bind<Config<RestSchema>>(Component.Config)
    .to(RestConfig)
    .inSingletonScope();
  restApplicationContainer
    .bind<DatabaseClient>(Component.DatabaseClient)
    .to(MongoDatabaseClient)
    .inSingletonScope();
  restApplicationContainer
    .bind<ExceptionFilter>(Component.ExceptionFilter)
    .to(AppExceptionFilter)
    .inSingletonScope();
  restApplicationContainer
    .bind<ExceptionFilter>(Component.HttpExceptionFilter)
    .to(HttpErrorExceptionFilter)
    .inSingletonScope();
  restApplicationContainer
    .bind<ExceptionFilter>(Component.ValidationExceptionFilter)
    .to(ValidationExceptionFilter)
    .inSingletonScope();
  restApplicationContainer
    .bind<PathTransformer>(Component.PathTransformer)
    .to(PathTransformer)
    .inSingletonScope();

  // Bind Redis client for caching
  restApplicationContainer
    .bind<RedisClient>(Component.RedisClient)
    .to(DefaultRedisClient)
    .inSingletonScope();

  // Bind Cache service as singleton (reusable across modules)
  restApplicationContainer
    .bind<CacheService>(Component.CacheService)
    .to(DefaultCacheService)
    .inSingletonScope();

  return restApplicationContainer;
}
