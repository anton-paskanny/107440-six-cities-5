import { Config, RestSchema } from './index.js';

export class MockConfig implements Config<RestSchema> {
  private readonly config: Partial<RestSchema> = {
    CACHE_TTL_CITIES: 3600
    // Add other default values as needed for CLI
  };

  public get<T extends keyof RestSchema>(key: T): RestSchema[T] {
    return this.config[key] as RestSchema[T];
  }
}
