/* eslint-disable node/no-process-exit */
import { inject, injectable } from 'inversify';
import express, { Express } from 'express';
import { Server as HttpServer } from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import { createHttpLogger } from '../../shared/libs/logger/index.js';
import { Config, RestSchema } from '../../shared/libs/config/index.js';
import { RedisClient } from '../../shared/libs/cache/index.js';
import { Logger } from '../../shared/libs/logger/index.js';
import { Component } from '../../shared/types/index.js';
import { DatabaseClient } from '../../shared/libs/database-client/index.js';
import { getMongoURI, getFullServerPath } from '../../shared/helpers/index.js';
import { Controller, ExceptionFilter } from '../../shared/libs/rest/index.js';
import { ParseTokenMiddleware } from '../../shared/libs/rest/middleware/parse-token.middleware.js';
import { RateLimiterMiddleware } from '../../shared/libs/rest/middleware/rate-limiter.middleware.js';
import { CompressionMiddleware } from '../../shared/libs/rest/middleware/compression.middleware.js';
import { STATIC_FILES_ROUTE, STATIC_UPLOAD_ROUTE } from './rest.constants.js';

@injectable()
export class RestApplication {
  private server: Express;
  private httpServer: HttpServer | null = null;
  private rateLimiter: RateLimiterMiddleware;
  private isShuttingDown = false;

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
    @inject(Component.HealthController)
    private readonly healthController: Controller,
    @inject(Component.ExceptionFilter)
    private readonly appExceptionFilter: ExceptionFilter,
    @inject(Component.AuthExceptionFilter)
    private readonly authExceptionFilter: ExceptionFilter,
    @inject(Component.HttpExceptionFilter)
    private readonly httpExceptionFilter: ExceptionFilter,
    @inject(Component.ValidationExceptionFilter)
    private readonly validationExceptionFilter: ExceptionFilter,
    @inject(Component.RedisClient)
    private readonly redisClient: RedisClient
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
    this.httpServer = this.server.listen(port, () => {
      this.logger.info(`HTTP server listening on port ${port}`);
    });

    // Setup graceful shutdown
    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        this.logger.warn('Shutdown already in progress, ignoring signal');
        return;
      }

      this.isShuttingDown = true;
      this.logger.info(`Received ${signal}, starting graceful shutdown...`);

      try {
        // Stop accepting new connections
        if (this.httpServer) {
          this.logger.info('Closing HTTP server...');
          this.httpServer.close(() => {
            this.logger.info('HTTP server closed');
          });
        }

        // Close database connections
        this.logger.info('Closing database connections...');
        await this.databaseClient.disconnect();
        this.logger.info('Database connections closed');

        // Close Redis connections
        this.logger.info('Closing Redis connections...');
        await this.redisClient.disconnect();
        this.logger.info('Redis connections closed');

        this.logger.info('Graceful shutdown completed successfully');
        // Force exit after cleanup is complete
        setTimeout(() => {
          // eslint-disable-next-line no-process-exit
          process.exit(0);
        }, 100);
      } catch (error) {
        this.logger.error('Error during graceful shutdown:', error as Error);
        // Force exit on error
        setTimeout(() => {
          // eslint-disable-next-line no-process-exit
          process.exit(1);
        }, 100);
      }
    };

    // Handle termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      const error =
        reason instanceof Error ? reason : new Error(String(reason));
      this.logger.error('Unhandled Rejection', error, {
        promise: promise.toString()
      });
      shutdown('unhandledRejection');
    });
  }

  private async _initCache() {
    try {
      await this.redisClient.connect();
    } catch (error) {
      this.logger.error('Failed to initialize Redis client:', error as Error);
    }
  }

  private async _initRateLimiter() {
    // Create and initialize rate limiter after Redis is connected
    this.rateLimiter = new RateLimiterMiddleware(this.config, this.redisClient);
    await this.rateLimiter.initialize();
  }

  private async _initControllers() {
    this.server.use('/cities', this.cityController.router);
    this.server.use('/users', this.userController.router);
    this.server.use('/rentOffers', this.rentOfferController.router);
    this.server.use('/comments', this.commentController.router);
    this.server.use('/favorites', this.favoriteController.router);
    this.server.use('/health', this.healthController.router);
  }

  private async _initMiddleware() {
    const authenticateMiddleware = new ParseTokenMiddleware(
      this.config.get('JWT_SECRET')
    );

    // Apply security headers
    this.server.use(helmet());

    // Apply rate limiting early in the middleware chain (single instance)
    this.server.use(this.rateLimiter.execute.bind(this.rateLimiter));

    // HTTP request logging with request IDs
    const httpLogger = createHttpLogger();
    this.server.use(httpLogger);

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

    // Compression middleware
    const compressionMiddleware = new CompressionMiddleware();
    this.server.use(compressionMiddleware.execute.bind(compressionMiddleware));
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

    this.logger.info('Init cache…');
    await this._initCache();
    this.logger.info('Cache initialization completed');

    this.logger.info('Init rate limiter…');
    await this._initRateLimiter();
    this.logger.info('Rate limiter initialization completed');

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
