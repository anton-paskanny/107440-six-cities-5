import { inject, injectable } from 'inversify';
import { DocumentType, types } from '@typegoose/typegoose';
import { UserService } from './user.service.interface.js';
import { UserEntity } from './user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { Component } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { DEFAULT_AVATAR_FILE_NAME } from './user.constants.js';
import { CacheService } from '../../libs/cache/index.js';
import { Config, RestSchema } from '../../libs/config/index.js';

@injectable()
export class DefaultUserService implements UserService {
  private readonly CACHE_TTL: number;
  private readonly USER_PROFILE_KEY = 'user:profile';
  private readonly USER_AVATAR_KEY = 'user:avatar';
  private readonly USER_EXISTS_KEY = 'user:exists';

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.UserModel)
    private readonly userModel: types.ModelType<UserEntity>,
    @inject(Component.CacheService)
    private readonly cacheService: CacheService,
    @inject(Component.Config) private readonly config: Config<RestSchema>
  ) {
    const configuredTtl = this.config.get('CACHE_TTL_USERS');
    this.CACHE_TTL = typeof configuredTtl === 'number' ? configuredTtl : 7200; // 2 hours default
  }

  public async exists(documentId: string): Promise<boolean> {
    const cacheKey = this.cacheService.generateKey(
      this.USER_EXISTS_KEY,
      documentId
    );

    const cachedExists = await this.cacheService.get<boolean>(cacheKey);

    if (cachedExists !== null) {
      this.logger.info(
        `User existence check for ${documentId} retrieved from cache`
      );
      return cachedExists;
    }

    const exists = (await this.userModel.exists({ _id: documentId })) !== null;

    // Cache the result (shorter TTL for existence checks)
    await this.cacheService.set(
      cacheKey,
      exists,
      Math.floor(this.CACHE_TTL / 4)
    ); // 30 minutes for existence checks

    this.logger.info(
      `User existence check for ${documentId} cached for ${Math.floor(
        this.CACHE_TTL / 4
      )} seconds`
    );

    return exists;
  }

  public async create(
    dto: CreateUserDto,
    salt: string
  ): Promise<DocumentType<UserEntity>> {
    const user = new UserEntity({
      ...dto,
      avatarPath: DEFAULT_AVATAR_FILE_NAME
    });
    user.setPassword(dto.password, salt);

    const result = await this.userModel.create(user);
    this.logger.info(`New user created: ${user.email}`);

    // Invalidate relevant caches when a new user is created
    await this.invalidateUserCaches(result.id);

    return result;
  }

  public async findById(
    userId: string
  ): Promise<DocumentType<UserEntity> | null> {
    const cacheKey = this.cacheService.generateKey(
      this.USER_PROFILE_KEY,
      userId
    );

    const cachedUser =
      await this.cacheService.get<DocumentType<UserEntity>>(cacheKey);

    if (cachedUser) {
      this.logger.info(`User profile ${userId} retrieved from cache`);
      return cachedUser;
    }

    const user = await this.userModel.findById(userId);

    if (user) {
      // Store as plain object for safe JSON serialization
      await this.cacheService.set(cacheKey, user.toObject(), this.CACHE_TTL);
      this.logger.info(
        `User profile ${userId} cached for ${this.CACHE_TTL} seconds`
      );
    }

    return user;
  }

  public async findByEmail(
    email: string
  ): Promise<DocumentType<UserEntity> | null> {
    // For email lookups, we'll use a different cache key pattern
    const cacheKey = this.cacheService.generateKey(
      this.USER_PROFILE_KEY,
      'email',
      email
    );

    const cachedUser =
      await this.cacheService.get<DocumentType<UserEntity>>(cacheKey);

    if (cachedUser) {
      this.logger.info(`User by email ${email} retrieved from cache`);
      return cachedUser;
    }

    const user = await this.userModel.findOne({ email });

    if (user) {
      // Cache both by email and by ID for future lookups
      await this.cacheService.set(cacheKey, user.toObject(), this.CACHE_TTL);
      await this.cacheService.set(
        this.cacheService.generateKey(this.USER_PROFILE_KEY, user.id),
        user.toObject(),
        this.CACHE_TTL
      );
      this.logger.info(
        `User by email ${email} cached for ${this.CACHE_TTL} seconds`
      );
    }

    return user;
  }

  public async findOrCreate(
    dto: CreateUserDto,
    salt: string
  ): Promise<DocumentType<UserEntity>> {
    const existedUser = await this.findByEmail(dto.email);

    if (existedUser) {
      return existedUser;
    }

    return this.create(dto, salt);
  }

  public async updateById(
    userId: string,
    dto: UpdateUserDto
  ): Promise<DocumentType<UserEntity> | null> {
    const result = await this.userModel
      .findByIdAndUpdate(userId, dto, { new: true })
      .exec();

    if (result) {
      // Invalidate all user-related caches when profile is updated
      await this.invalidateUserCaches(userId);
      this.logger.info(`User ${userId} profile updated and caches invalidated`);
    }

    return result;
  }

  /**
   * Get user avatar information (cached)
   */
  public async getAvatarInfo(
    userId: string
  ): Promise<{ avatarPath: string } | null> {
    const cacheKey = this.cacheService.generateKey(
      this.USER_AVATAR_KEY,
      userId
    );

    const cachedAvatar = await this.cacheService.get<{ avatarPath: string }>(
      cacheKey
    );

    if (cachedAvatar) {
      this.logger.info(`User avatar ${userId} retrieved from cache`);
      return cachedAvatar;
    }

    const user = await this.userModel.findById(userId).select('avatarPath');

    if (user) {
      const avatarInfo = { avatarPath: user.avatarPath };
      // Cache avatar info with shorter TTL than profile data
      await this.cacheService.set(
        cacheKey,
        avatarInfo,
        Math.floor(this.CACHE_TTL / 2)
      ); // 1 hour for avatar
      this.logger.info(
        `User avatar ${userId} cached for ${Math.floor(
          this.CACHE_TTL / 2
        )} seconds`
      );
      return avatarInfo;
    }

    return null;
  }

  /**
   * Update user avatar and invalidate relevant caches
   */
  public async updateAvatar(userId: string, avatarPath: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { avatarPath }).exec();

    // Invalidate avatar cache specifically
    await this.cacheService.delete(
      this.cacheService.generateKey(this.USER_AVATAR_KEY, userId)
    );

    // Also invalidate profile cache since avatar is part of profile
    await this.cacheService.delete(
      this.cacheService.generateKey(this.USER_PROFILE_KEY, userId)
    );

    this.logger.info(`User ${userId} avatar updated and caches invalidated`);
  }

  /**
   * Invalidate all user-related caches
   */
  private async invalidateUserCaches(userId: string): Promise<void> {
    try {
      const keysToDelete = [
        this.cacheService.generateKey(this.USER_PROFILE_KEY, userId),
        this.cacheService.generateKey(this.USER_AVATAR_KEY, userId),
        this.cacheService.generateKey(this.USER_EXISTS_KEY, userId)
      ];

      for (const key of keysToDelete) {
        await this.cacheService.delete(key);
      }

      this.logger.info(`User ${userId} caches invalidated`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate user ${userId} caches:`,
        error as Error
      );
    }
  }

  /**
   * Clear all user caches (useful for maintenance or data migration)
   */
  public async clearAllUserCaches(): Promise<void> {
    try {
      // This is a more aggressive approach - in production you might want to be more selective
      await this.cacheService.clear();
      this.logger.info('All user caches cleared');
    } catch (error) {
      this.logger.error('Failed to clear user caches:', error as Error);
    }
  }
}
