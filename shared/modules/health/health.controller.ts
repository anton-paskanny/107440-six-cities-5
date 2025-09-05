import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BaseController, HttpMethod } from '../../libs/rest/index.js';
import { Component } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { DatabaseClient } from '../../libs/database-client/index.js';
import { RedisClient } from '../../libs/cache/index.js';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'connected' | 'disconnected' | 'error';
    redis: 'connected' | 'disconnected' | 'error';
  };
}

interface ReadinessResponse {
  status: 'ready' | 'not_ready';
  timestamp: string;
  checks: {
    database: boolean;
    redis: boolean;
  };
}

@injectable()
export class HealthController extends BaseController {
  constructor(
    @inject(Component.Logger) protected readonly logger: Logger,
    @inject(Component.DatabaseClient)
    private readonly databaseClient: DatabaseClient,
    @inject(Component.RedisClient)
    private readonly redisClient: RedisClient
  ) {
    super(logger);
    this.logger.info('Register routes for HealthController');

    // Health check endpoint - basic application health
    this.addRoute({
      path: '/',
      method: HttpMethod.Get,
      handler: this.health
    });

    // Readiness check - whether app is ready to serve traffic
    this.addRoute({
      path: '/ready',
      method: HttpMethod.Get,
      handler: this.readiness
    });

    // Liveness check - whether app is alive (minimal check)
    this.addRoute({
      path: '/live',
      method: HttpMethod.Get,
      handler: this.liveness
    });
  }

  public async health(_req: Request, res: Response): Promise<void> {
    try {
      const [dbStatus, redisStatus] = await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis()
      ]);

      const response: HealthCheckResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database:
            dbStatus.status === 'fulfilled' && dbStatus.value
              ? 'connected'
              : 'error',
          redis:
            redisStatus.status === 'fulfilled' && redisStatus.value
              ? 'connected'
              : 'error'
        }
      };

      // If any critical service is down, mark as unhealthy
      if (
        response.services.database === 'error' ||
        response.services.redis === 'error'
      ) {
        response.status = 'unhealthy';
        res.status(StatusCodes.SERVICE_UNAVAILABLE);
      } else {
        res.status(StatusCodes.OK);
      }

      res.json(response);
    } catch (error) {
      this.logger.error('Health check failed:', error as Error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  }

  public async readiness(_req: Request, res: Response): Promise<void> {
    try {
      const [dbReady, redisReady] = await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis()
      ]);

      const response: ReadinessResponse = {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbReady.status === 'fulfilled' && dbReady.value,
          redis: redisReady.status === 'fulfilled' && redisReady.value
        }
      };

      // App is ready only if all critical services are available
      if (!response.checks.database || !response.checks.redis) {
        response.status = 'not_ready';
        res.status(StatusCodes.SERVICE_UNAVAILABLE);
      } else {
        res.status(StatusCodes.OK);
      }

      res.json(response);
    } catch (error) {
      this.logger.error('Readiness check failed:', error as Error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed'
      });
    }
  }

  public async liveness(_req: Request, res: Response): Promise<void> {
    // Simple liveness check - just return OK if the process is running
    res.status(StatusCodes.OK).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      return this.databaseClient.isConnectedToDatabase();
    } catch (error) {
      this.logger.error('Database health check failed:', error as Error);
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      return this.redisClient.isConnected();
    } catch (error) {
      this.logger.error('Redis health check failed:', error as Error);
      return false;
    }
  }
}
