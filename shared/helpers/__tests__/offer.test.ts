import { describe, it, expect } from 'vitest';
import { createRentOffer } from '../offer.js';

function makeRow(overrides: Partial<Record<string, string>> = {}) {
  const base = {
    title: 'Nice flat',
    cityName: 'Amsterdam',
    latitude: '52',
    longitude: '4',
    description: 'Cozy',
    publishDate: new Date('2023-01-01').toISOString(),
    preview: 'preview.jpg',
    images: '1.jpg,2.jpg',
    rating: '4',
    guests: '2',
    houseType: 'Apartment',
    price: '100',
    rooms: '1',
    features: 'Breakfast,Air conditioning',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    isPremium: 'true',
    isFavorite: 'false',
    avatarPath: '/a.png',
    userType: 'Regular',
    commentCount: '3',
    offerLatitude: '52',
    offerLongitude: '4'
  };

  const row = { ...base, ...overrides } as Record<string, string>;
  return [
    row.title,
    row.cityName,
    row.latitude,
    row.longitude,
    row.description,
    row.publishDate,
    row.preview,
    row.images,
    row.rating,
    row.guests,
    row.houseType,
    row.price,
    row.rooms,
    row.features,
    row.firstName,
    row.lastName,
    row.email,
    row.isPremium,
    row.isFavorite,
    row.avatarPath,
    row.userType,
    row.commentCount,
    row.offerLatitude,
    row.offerLongitude
  ].join('\t');
}

describe('helpers/offer', () => {
  it('createRentOffer parses row into object', () => {
    const offer = createRentOffer(makeRow());
    expect(offer.title).toBe('Nice flat');
    expect(offer.city.name).toBe('Amsterdam');
    expect(offer.images).toEqual(['1.jpg', '2.jpg']);
    expect(offer.rating).toBe(4);
    expect(offer.guests).toBe(2);
    expect(offer.rooms).toBe(1);
    expect(offer.isPremium).toBe(true);
    expect(offer.isFavorite).toBe(true);
    expect(offer.price).toBe(100);
    expect(offer.commentCount).toBe(3);
    expect(offer.houseType).toBeDefined();
    expect(Array.isArray(offer.features)).toBe(true);
    expect(offer.latitude).toBe(52);
    expect(offer.longitude).toBe(4);
  });
});
