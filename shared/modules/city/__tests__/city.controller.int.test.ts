import express from 'express';
import request from 'supertest';
import { DocumentType } from '@typegoose/typegoose';
import { describe, it, expect, vi } from 'vitest';
import { Logger } from '../../../libs/logger/index.js';
import { CityController } from '../city.controller.js';
import { RentOfferEntity } from '../../rent-offer/index.js';
import { CityEntity, CreateCityDto } from '../index.js';

// Mock modules that import Typegoose models to avoid schema building side-effects
vi.mock('../../favorite/index.js', () => ({
  FavoriteEntity: class {},
  FavoriteService: class {}
}));
vi.mock('../../rent-offer/index.js', () => ({
  RentOfferService: class {},
  RentOfferRdo: class {},
  MAX_PREMIUM_OFFERS_COUNT: 3
}));

class NoopLogger implements Logger {
  info(): void {}
  warn(): void {}
  error(): void {}
  debug(): void {}
  child(): Logger {
    return this;
  }
}

// Minimal stubs to satisfy controller dependencies
const stubCityService = {
  find: async () =>
    [
      { id: '1', name: 'Amsterdam', latitude: 52, longitude: 4 }
    ] as DocumentType<CityEntity>[],
  findByCityName: async () => null,
  findByCityId: async () => null,
  findByCityNameOrCreate: async () =>
    ({
      id: '1',
      name: 'Amsterdam',
      latitude: 52,
      longitude: 4
    }) as DocumentType<CityEntity>,
  exists: async () => false,
  create: async (dto: CreateCityDto) =>
    ({ id: '2', ...dto }) as DocumentType<CityEntity>
};
const stubRentOfferService = {
  findByCityId: async () => [],
  findPremiumByCityId: async () => [],
  create: async () => ({}) as DocumentType<RentOfferEntity>,
  findById: async () => null,
  find: async () => [],
  deleteById: async () => null,
  updateById: async () => null,
  exists: async () => false,
  findPremium: async () => [],
  incCommentCount: async () => null,
  findNew: async () => [],
  findDiscussed: async () => []
};
const stubFavoriteService = {
  findByUserId: async () => null,
  findFavoriteById: async () => null,
  addToFavorite: async () => null,
  removeFromFavorite: async () => null,
  isFavorite: async () => false
};

// Provide missing DI properties for BaseController
function primeController(controller: Record<string, unknown>) {
  (controller as Record<string, unknown>).pathTranformer = {
    execute: (d: Record<string, unknown>) => d
  };
}

describe('CityController (integration-light)', () => {
  it('GET /cities returns array', async () => {
    const app = express();
    app.use(express.json());

    const controller = new CityController(
      new NoopLogger(),
      stubCityService,
      stubRentOfferService,
      stubFavoriteService
    );
    primeController(controller as unknown as Record<string, unknown>);

    app.use('/cities', controller.router);

    const res = await request(app).get('/cities').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('Amsterdam');
  });
});
