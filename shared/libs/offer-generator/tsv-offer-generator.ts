import dayjs from 'dayjs';
import { OfferGenerator } from './offer-generator.interface.js';
import {
  MockServerData,
  HouseType,
  FeatureType,
  City,
  UserType
} from '../../types/index.js';
import {
  generateRandomValue,
  getRandomItem,
  getRandomItems
} from '../../helpers/index.js';

const MIN_PRICE = 10;
const MAX_PRICE = 10000;

const MIN_RATING = 1;
const MAX_RATING = 5;

const MIN_GUESTS = 1;
const MAX_GUESTS = 10;

const MIN_ROOMS = 1;
const MAX_ROOMS = 8;

const FIRST_WEEK_DAY = 1;
const LAST_WEEK_DAY = 7;

const BOOLEAN_STATES = [true, false];

export class TSVOfferGenerator implements OfferGenerator {
  constructor(private readonly mockData: MockServerData) {}

  public generate(): string {
    const title = getRandomItem<string>(this.mockData.titles);
    const city = getRandomItem<City>(this.mockData.cities);
    const description = getRandomItem<string>(this.mockData.descriptions);
    const preview = getRandomItem<string>(this.mockData.previewImages);
    const images = getRandomItems<string>(this.mockData.galleryImages, 6);
    const features = getRandomItems<string>([
      FeatureType.AirCond,
      FeatureType.BabySeat,
      FeatureType.Breakfast,
      FeatureType.Fridge,
      FeatureType.Laptop,
      FeatureType.Towels,
      FeatureType.Washer
    ]);
    const houseType = getRandomItem<string>([
      HouseType.Apartment,
      HouseType.Hotel,
      HouseType.House,
      HouseType.Room
    ]);
    const isPremium = getRandomItem<boolean>(BOOLEAN_STATES);
    const isFavorite = getRandomItem<boolean>(BOOLEAN_STATES);
    const price = generateRandomValue(MIN_PRICE, MAX_PRICE).toString();
    const rooms = generateRandomValue(MIN_ROOMS, MAX_ROOMS).toString();
    const guests = generateRandomValue(MIN_GUESTS, MAX_GUESTS).toString();
    const rating = generateRandomValue(MIN_RATING, MAX_RATING, 1).toString();
    const user = getRandomItem<string>(this.mockData.users);
    const email = getRandomItem<string>(this.mockData.emails);
    const avatarPath = getRandomItem<string>(this.mockData.avatars);
    const commentCount = generateRandomValue(0, 50);

    const offerLatitude = generateRandomValue(0, 50);
    const offerLongitude = generateRandomValue(0, 50);

    const publishedDate = dayjs()
      .subtract(generateRandomValue(FIRST_WEEK_DAY, LAST_WEEK_DAY), 'day')
      .toISOString();

    const [firstName, lastName] = user.split(' ');

    const userType = getRandomItem<string>([UserType.Pro, UserType.Regular]);

    const { name, latitude, longitude } = city;

    return [
      title,
      name,
      latitude,
      longitude,
      description,
      publishedDate,
      preview,
      images,
      rating,
      guests,
      houseType,
      price,
      rooms,
      features,
      firstName,
      lastName,
      email,
      isPremium,
      isFavorite,
      avatarPath,
      userType,
      commentCount,
      offerLatitude,
      offerLongitude
    ].join('\t');
  }
}
