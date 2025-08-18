import { inject, injectable } from 'inversify';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Config, RestSchema } from '../../shared/libs/config/index.js';
import { Logger } from '../../shared/libs/logger/index.js';
import { Component } from '../../shared/types/index.js';
import { DatabaseClient } from '../../shared/libs/database-client/index.js';
import { getMongoURI, getFullServerPath } from '../../shared/helpers/index.js';
import { Controller, ExceptionFilter } from '../../shared/libs/rest/index.js';
import { ParseTokenMiddleware } from '../../shared/libs/rest/middleware/parse-token.middleware.js';
import { RateLimiterMiddleware } from '../../shared/libs/rest/middleware/rate-limiter.middleware.js';
import { STATIC_FILES_ROUTE, STATIC_UPLOAD_ROUTE } from './rest.constants.js';

@injectable()
export class RestApplication {
  private server: Express;

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config<RestSchema>,
    @inject(Component.DatabaseClient)
    private readonly databaseClient: DatabaseClient,
    @inject(Component.CityController)
    private readonly cityController: Controller,
    @inject(Component.UserController)
    private readonly userController: Controller,
    @inject(Component.RentOfferController)
    private readonly rentOfferController: Controller,
    @inject(Component.CommentController)
    private readonly commentController: Controller,
    @inject(Component.FavoriteController)
    private readonly favoriteController: Controller,
    @inject(Component.ExceptionFilter)
    private readonly appExceptionFilter: ExceptionFilter,
    @inject(Component.AuthExceptionFilter)
    private readonly authExceptionFilter: ExceptionFilter,
    @inject(Component.HttpExceptionFilter)
    private readonly httpExceptionFilter: ExceptionFilter,
    @inject(Component.ValidationExceptionFilter)
    private readonly validationExceptionFilter: ExceptionFilter
  ) {
    this.server = express();
  }

  private async _initDb() {
    const mongoUri = getMongoURI(
      this.config.get('DB_USER'),
      this.config.get('DB_PASSWORD'),
      this.config.get('DB_HOST'),
      this.config.get('DB_PORT'),
      this.config.get('DB_NAME')
    );

    return this.databaseClient.connect(mongoUri);
  }

  private async _initServer() {
    const port = this.config.get('PORT');
    this.server.listen(port);
  }

  private async _initControllers() {
    this.server.use('/cities', this.cityController.router);
    this.server.use('/users', this.userController.router);
    this.server.use('/rentOffers', this.rentOfferController.router);
    this.server.use('/comments', this.commentController.router);
    this.server.use('/favorites', this.favoriteController.router);
  }

  private async _initMiddleware() {
    const authenticateMiddleware = new ParseTokenMiddleware(
      this.config.get('JWT_SECRET')
    );

    // Apply security headers
    this.server.use(helmet());

    // Apply rate limiting early in the middleware chain (single instance)
    const rateLimiter = new RateLimiterMiddleware(this.config);
    this.server.use(rateLimiter.execute.bind(rateLimiter));

    // Apply request size limits
    this.server.use(
      express.json({ limit: this.config.get('MAX_REQUEST_SIZE') })
    );
    this.server.use(
      express.urlencoded({
        extended: true,
        limit: this.config.get('MAX_REQUEST_SIZE')
      })
    );
    this.server.use(
      STATIC_UPLOAD_ROUTE,
      express.static(this.config.get('UPLOAD_DIRECTORY'))
    );
    this.server.use(
      authenticateMiddleware.execute.bind(authenticateMiddleware)
    );

    this.server.use(
      STATIC_FILES_ROUTE,
      express.static(this.config.get('STATIC_DIRECTORY_PATH'))
    );

    // Configure CORS with more restrictive settings
    this.server.use(
      cors({
        origin:
          process.env.NODE_ENV === 'production'
            ? [this.config.get('HOST')]
            : true, // Allow all origins in development
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400 // 24 hours
      })
    );
  }

  private async _initExceptionFilters() {
    this.server.use(
      this.authExceptionFilter.catch.bind(this.authExceptionFilter)
    );
    this.server.use(
      this.validationExceptionFilter.catch.bind(this.validationExceptionFilter)
    );
    this.server.use(
      this.httpExceptionFilter.catch.bind(this.httpExceptionFilter)
    );
    this.server.use(
      this.appExceptionFilter.catch.bind(this.appExceptionFilter)
    );
  }

  public async init() {
    this.logger.info('Application initialization');
    this.logger.info(`Get value from env $PORT: ${this.config.get('PORT')}`);

    this.logger.info('Init database…');
    await this._initDb();
    this.logger.info('Init database completed');

    this.logger.info('Init app-level middleware');
    await this._initMiddleware();
    this.logger.info('App-level middleware initialization completed');

    this.logger.info('Init controllers');
    await this._initControllers();
    this.logger.info('Controller initialization completed');

    this.logger.info('Init exception filters');
    await this._initExceptionFilters();
    this.logger.info('Exception filters initialization compleated');

    this.logger.info('Init server…');
    await this._initServer();
    this.logger.info(
      `🚀 Server started on ${getFullServerPath(
        this.config.get('HOST'),
        this.config.get('PORT')
      )}`
    );
  }
}
