import request from 'supertest';
import { DocumentType } from '@typegoose/typegoose';
import { describe, it, expect, vi } from 'vitest';
import { CityController } from '../city.controller.js';
import { RentOfferEntity } from '../../rent-offer/index.js';
import { CityEntity, CreateCityDto } from '../index.js';
import {
  NoopLogger,
  primeController,
  createTestApp,
  applyErrorHandler
} from '../../../tests/integration-helpers.js';

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

describe('CityController (integration-light)', () => {
  it('GET /cities returns array', async () => {
    const app = createTestApp();

    const controller = new CityController(
      new NoopLogger(),
      stubCityService,
      stubRentOfferService,
      stubFavoriteService
    );
    primeController(controller as unknown as Record<string, unknown>);

    app.use('/cities', controller.router);
    applyErrorHandler(app);

    const res = await request(app).get('/cities').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('Amsterdam');
  });

  it('POST /cities without auth returns 401', async () => {
    const app = createTestApp();

    const controller = new CityController(
      new NoopLogger(),
      stubCityService,
      stubRentOfferService,
      stubFavoriteService
    );
    primeController(controller as unknown as Record<string, unknown>);

    app.use('/cities', controller.router);
    applyErrorHandler(app);

    await request(app)
      .post('/cities')
      .send({ name: 'Paris', latitude: 48.85, longitude: 2.35 })
      .expect(401);
  });

  it('POST /cities with auth and valid body returns 201', async () => {
    const app = createTestApp({ tokenPayload: { id: 'u1' } });

    const controller = new CityController(
      new NoopLogger(),
      stubCityService,
      stubRentOfferService,
      stubFavoriteService
    );
    primeController(controller as unknown as Record<string, unknown>);

    app.use('/cities', controller.router);
    applyErrorHandler(app);

    const res = await request(app)
      .post('/cities')
      .send({ name: 'Rotterdam', latitude: 51.92, longitude: 4.48 })
      .expect(201);
    expect(res.body.name).toBe('Rotterdam');
  });

  it('GET /cities/:cityId/rentOffers with non-existing id returns 404', async () => {
    const app = createTestApp();

    const controller = new CityController(
      new NoopLogger(),
      stubCityService,
      stubRentOfferService,
      stubFavoriteService
    );
    primeController(controller as unknown as Record<string, unknown>);

    app.use('/cities', controller.router);
    applyErrorHandler(app);

    await request(app)
      .get('/cities/507f1f77bcf86cd799439011/rentOffers')
      .expect(404);
  });
});
