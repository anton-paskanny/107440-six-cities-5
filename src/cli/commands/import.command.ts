import { Command } from './command.interface.js';
import { TSVFileReader } from '../../../shared/libs/file-reader/index.js';
import {
  createRentOffer,
  getErrorMessage,
  getMongoURI
} from '../../../shared/helpers/index.js';
import { UserService } from '../../../shared/modules/user/user.service.interface.js';
import {
  CityModel,
  CityService,
  DefaultCityService
} from '../../../shared/modules/city/index.js';
import {
  DefaultRentOfferService,
  RentOfferModel,
  RentOfferService
} from '../../../shared/modules/rent-offer/index.js';
import {
  DatabaseClient,
  MongoDatabaseClient
} from '../../../shared/libs/database-client/index.js';
import { Logger } from '../../../shared/libs/logger/index.js';
import { ConsoleLogger } from '../../../shared/libs/logger/console.logger.js';
import {
  DefaultUserService,
  UserModel
} from '../../../shared/modules/user/index.js';
import { DEFAULT_DB_PORT, DEFAULT_USER_PASSWORD } from './command.constants.js';
import { FeatureType, RentOffer } from '../../../shared/types/index.js';

export class ImportCommand implements Command {
  private userService: UserService;
  private cityService: CityService;
  private rentOfferService: RentOfferService;
  private databaseClient: DatabaseClient;
  private logger: Logger;
  private salt: string;

  constructor() {
    this.onImportedLine = this.onImportedLine.bind(this);
    this.onCompleteImport = this.onCompleteImport.bind(this);

    this.logger = new ConsoleLogger();
    this.rentOfferService = new DefaultRentOfferService(
      this.logger,
      RentOfferModel,
      CityModel
    );
    this.cityService = new DefaultCityService(this.logger, CityModel);
    this.userService = new DefaultUserService(this.logger, UserModel);
    this.databaseClient = new MongoDatabaseClient(this.logger);
  }

  public getName(): string {
    return '--import';
  }

  private async onImportedLine(line: string, resolve: () => void) {
    const offer = createRentOffer(line);
    await this.saveOffer(offer);
    resolve();
  }

  private onCompleteImport(count: number) {
    console.info(`${count} rows imported.`);
    this.databaseClient.disconnect();
  }

  private async saveOffer(offer: RentOffer) {
    const features: FeatureType[] = [];
    const { name, latitude, longitude } = offer.city;

    const user = await this.userService.findOrCreate(
      {
        ...offer.user,
        password: DEFAULT_USER_PASSWORD
      },
      this.salt
    );

    const existCity = await this.cityService.findByCityNameOrCreate(name, {
      name,
      latitude,
      longitude
    });

    for (const featureName of offer.features) {
      features.push(featureName);
    }

    await this.rentOfferService.create({
      features,
      userId: user.id,
      cityId: existCity.id,
      title: offer.title,
      description: offer.description,
      images: offer.images,
      publishDate: offer.publishDate,
      isPremium: offer.isPremium,
      price: offer.price,
      rating: offer.rating,
      rooms: offer.rooms,
      guests: offer.guests,
      houseType: offer.houseType,
      latitude: offer.latitude,
      longitude: offer.longitude
    });
  }

  public async execute(
    filename: string,
    login: string,
    password: string,
    host: string,
    dbname: string,
    salt: string
  ): Promise<void> {
    const uri = getMongoURI(login, password, host, DEFAULT_DB_PORT, dbname);
    this.salt = salt;

    const fileReader = new TSVFileReader(filename.trim());

    fileReader.on('line', this.onImportedLine);

    fileReader.on('end', this.onCompleteImport);

    await this.databaseClient.connect(uri);

    try {
      fileReader.read();
    } catch (err) {
      if (!(err instanceof Error)) {
        throw err;
      }

      console.error(`Can't import data from file: ${filename}`);
      console.error(getErrorMessage(err));
    }
  }
}
