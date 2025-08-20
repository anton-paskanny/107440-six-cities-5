import convict from 'convict';
import validator from 'convict-format-with-validator';

convict.addFormats(validator);

export type RestSchema = {
  PORT: number;
  SALT: string;
  DB_HOST: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_PORT: string;
  DB_NAME: string;
  UPLOAD_DIRECTORY: string;
  JWT_SECRET: string;
  HOST: string;
  STATIC_DIRECTORY_PATH: string;
  MAX_REQUEST_SIZE: number;
  // Rate limiting configuration
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_PUBLIC: number;
  RATE_LIMIT_MAX_AUTH: number;
  RATE_LIMIT_MAX_UPLOAD: number;
  RATE_LIMIT_MAX_USER_API: number;
  // Redis configuration
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string | null;
  REDIS_DB: number;
  // Cache configuration
  CACHE_TTL_CITIES: number;
  CACHE_TTL_USERS: number;
};

export const configRestSchema = convict<RestSchema>({
  PORT: {
    doc: 'Port for incoming connections',
    format: 'port',
    env: 'PORT',
    default: 4000
  },
  SALT: {
    doc: 'Salt for password hash',
    format: String,
    env: 'SALT',
    default: null
  },
  DB_HOST: {
    doc: 'IP address of the database server (MongoDB)',
    format: 'ipaddress',
    env: 'DB_HOST',
    default: '127.0.0.1'
  },
  DB_USER: {
    doc: 'Username to connect to the database',
    format: String,
    env: 'DB_USER',
    default: null
  },
  DB_PASSWORD: {
    doc: 'Password to connect to the database',
    format: String,
    env: 'DB_PASSWORD',
    default: null
  },
  DB_PORT: {
    doc: 'Port to connect to the database (MongoDB)',
    format: 'port',
    env: 'DB_PORT',
    default: '27017'
  },
  DB_NAME: {
    doc: 'Database name (MongoDB)',
    format: String,
    env: 'DB_NAME',
    default: 'six-cities'
  },
  UPLOAD_DIRECTORY: {
    doc: 'Directory for upload files',
    format: String,
    env: 'UPLOAD_DIRECTORY',
    default: null
  },
  JWT_SECRET: {
    doc: 'Secret for sign JWT',
    format: String,
    env: 'JWT_SECRET',
    default: null
  },
  HOST: {
    doc: 'Host where started service',
    format: String,
    env: 'HOST',
    default: 'localhost'
  },
  STATIC_DIRECTORY_PATH: {
    doc: 'Path to directory with static resources',
    format: String,
    env: 'STATIC_DIRECTORY_PATH',
    default: 'static'
  },
  // Rate limiting configuration
  RATE_LIMIT_WINDOW_MS: {
    doc: 'Rate limiting window in milliseconds',
    format: Number,
    env: 'RATE_LIMIT_WINDOW_MS',
    default: 60 * 1000 // 1 minute
  },
  RATE_LIMIT_MAX_PUBLIC: {
    doc: 'Maximum requests per window for public endpoints',
    format: Number,
    env: 'RATE_LIMIT_MAX_PUBLIC',
    default: 100
  },
  RATE_LIMIT_MAX_AUTH: {
    doc: 'Maximum requests per window for authentication endpoints',
    format: Number,
    env: 'RATE_LIMIT_MAX_AUTH',
    default: 5
  },
  RATE_LIMIT_MAX_UPLOAD: {
    doc: 'Maximum requests per window for file upload endpoints',
    format: Number,
    env: 'RATE_LIMIT_MAX_UPLOAD',
    default: 10
  },
  RATE_LIMIT_MAX_USER_API: {
    doc: 'Maximum requests per window for user API endpoints',
    format: Number,
    env: 'RATE_LIMIT_MAX_USER_API',
    default: 1000
  },
  // Redis configuration
  REDIS_HOST: {
    doc: 'Redis server host',
    format: String,
    env: 'REDIS_HOST',
    default: 'localhost'
  },
  REDIS_PORT: {
    doc: 'Redis server port',
    format: Number,
    env: 'REDIS_PORT',
    default: 6379
  },
  REDIS_PASSWORD: {
    doc: 'Redis server password',
    format: String,
    env: 'REDIS_PASSWORD',
    default: null
  },
  REDIS_DB: {
    doc: 'Redis database number',
    format: Number,
    env: 'REDIS_DB',
    default: 0
  },
  // Cache configuration
  CACHE_TTL_CITIES: {
    doc: 'Cache TTL for cities in seconds',
    format: Number,
    env: 'CACHE_TTL_CITIES',
    default: 3600
  },
  CACHE_TTL_USERS: {
    doc: 'Cache TTL for users in seconds',
    format: Number,
    env: 'CACHE_TTL_USERS',
    default: 7200
  },
  MAX_REQUEST_SIZE: {
    doc: 'Maximum request size in bytes',
    format: Number,
    env: 'MAX_REQUEST_SIZE',
    default: 10 * 1024 * 1024 // 10MB
  }
});
