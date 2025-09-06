import { config as dotEnvConfig } from 'dotenv';
import { inject, injectable } from 'inversify';
import { Config } from './config.interface.js';
import { Component } from '../../types/index.js';
import { Logger } from '../logger/index.js';
import { configRestSchema, RestSchema } from './rest.schema.js';

@injectable()
export class RestConfig implements Config<RestSchema> {
  private readonly config: RestSchema;

  constructor(@inject(Component.Logger) private readonly logger: Logger) {
    const parsedOutput = dotEnvConfig();

    if (parsedOutput.error) {
      this.logger.warn(
        'No .env file found, using environment variables directly'
      );
    } else {
      this.logger.info('.env file found and successfully parsed!');
    }

    configRestSchema.load({});
    configRestSchema.validate({ allowed: 'strict', output: this.logger.info });

    this.config = configRestSchema.getProperties();
  }

  public get<T extends keyof RestSchema>(key: T): RestSchema[T] {
    return this.config[key];
  }
}
