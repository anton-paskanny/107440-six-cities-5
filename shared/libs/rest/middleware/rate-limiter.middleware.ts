import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { Middleware } from './middleware.interface.js';
import { Config, RestSchema } from '../../config/index.js';

// Rate limit configurations for different endpoint types
const RATE_LIMITS = {
  // Public endpoints - general API access
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Authentication endpoints - prevent brute force attacks
  AUTH: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful auth
    skipFailedRequests: false
  },

  // File upload endpoints - prevent abuse
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: 'Too many file uploads, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // API endpoints per user - authenticated user limits
  USER_API: {
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute per user
    message: 'Too many requests for this user, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req: Request) => req.tokenPayload?.id || req.ip
  }
};

export class RateLimiterMiddleware implements Middleware {
  private publicLimiter: ReturnType<typeof rateLimit>;
  private authLimiter: ReturnType<typeof rateLimit>;
  private uploadLimiter: ReturnType<typeof rateLimit>;
  private userApiLimiter: ReturnType<typeof rateLimit>;

  constructor(private readonly config: Config<RestSchema>) {
    const windowMs = this.config.get('RATE_LIMIT_WINDOW_MS');

    this.publicLimiter = rateLimit({
      ...RATE_LIMITS.PUBLIC,
      windowMs,
      max: this.config.get('RATE_LIMIT_MAX_PUBLIC')
    });

    this.authLimiter = rateLimit({
      ...RATE_LIMITS.AUTH,
      windowMs,
      max: this.config.get('RATE_LIMIT_MAX_AUTH')
    });

    this.uploadLimiter = rateLimit({
      ...RATE_LIMITS.UPLOAD,
      windowMs,
      max: this.config.get('RATE_LIMIT_MAX_UPLOAD')
    });

    this.userApiLimiter = rateLimit({
      ...RATE_LIMITS.USER_API,
      windowMs,
      max: this.config.get('RATE_LIMIT_MAX_USER_API')
    });
  }

  public execute(req: Request, res: Response, next: NextFunction): void {
    const path = req.path;
    const method = req.method;

    const limiter = this.getRateLimiter(path, method);
    limiter(req, res, next);
  }

  private getRateLimiter(path: string, method: string) {
    // Create a Map with endpoint patterns as keys and limiters as values
    const endpointLimiterMap = new Map([
      ['auth', this.authLimiter],
      ['upload', this.uploadLimiter],
      ['userApi', this.userApiLimiter]
    ]);

    // Check each endpoint type in priority order
    if (this.isAuthEndpoint(path)) {
      return endpointLimiterMap.get('auth')!;
    }

    if (this.isUploadEndpoint(path)) {
      return endpointLimiterMap.get('upload')!;
    }

    if (this.isUserApiEndpoint(path, method)) {
      return endpointLimiterMap.get('userApi')!;
    }

    // Default to public rate limiting
    return this.publicLimiter;
  }

  private isAuthEndpoint(path: string): boolean {
    return (
      path.includes('/signin') ||
      path.includes('/signup') ||
      path.includes('/logout')
    );
  }

  private isUploadEndpoint(path: string): boolean {
    return (
      path.includes('/upload') ||
      path.includes('/avatar') ||
      path.includes('/preview') ||
      path.includes('/images')
    );
  }

  private isUserApiEndpoint(path: string, method: string): boolean {
    // Endpoints that require authentication and should have user-based rate limiting
    if (path.includes('/favorites') || path.includes('/comments')) {
      return true;
    }

    // For rentOffers and users, only apply user-based limiting for non-GET requests
    if (path.includes('/rentOffers') || path.includes('/users')) {
      return method !== 'GET';
    }

    return false;
  }
}
