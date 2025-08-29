import request from 'supertest';
import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';

// Import controller dynamically after mocks are applied
import {
  NoopLogger,
  primeController,
  createTestApp,
  applyErrorHandler,
  ensureDirectory
} from '../../../tests/integration-helpers.js';
import { UserController } from '../user.controller.js';

// Locally loosen constructor typing to avoid importing real service interfaces
type LooseUserControllerCtor = new (
  logger: unknown,
  userService: unknown,
  config: unknown,
  auth: unknown
) => UserController;
const LooseUserController =
  UserController as unknown as LooseUserControllerCtor;

// Define minimal local interfaces to avoid importing modules that pull Typegoose models
interface AuthServiceLike {
  verify: (dto: unknown) => Promise<unknown>;
  authenticate: (user: unknown) => Promise<string>;
}
interface UserServiceLike {
  findByEmail: (email: string) => Promise<unknown>;
  updateById: (id: string, dto: unknown) => Promise<unknown>;
}
interface ConfigLike {
  get: (key: string) => string;
}

// Prevent importing modules that register Typegoose models
vi.mock('../../auth/index.js', () => ({}));
vi.mock('../index.js', () => ({
  CreateUserDto: class {}
}));
vi.mock('../user.service.interface.js', () => ({}));
vi.mock('../user.entity.js', () => ({
  UserEntity: class {},
  UserModel: {}
}));
vi.mock('../../../libs/rest/middleware/upload-file.middleware.js', () => {
  class UploadFileMiddleware {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_uploadDirectory: string, _fieldName: string) {}
    public async execute(
      req: unknown,
      _res: unknown,
      next: () => void
    ): Promise<void> {
      (req as Record<string, unknown>).file = { filename: 'in-memory.png' };
      next();
    }
  }
  return { UploadFileMiddleware };
});

describe('UserController (integration-light)', () => {
  it('GET /users/signin returns 200 with token and existing user', async () => {
    const app = createTestApp({ tokenPayload: { email: 'user@example.com' } });

    const stubUser = {
      id: 'u1',
      email: 'user@example.com',
      name: 'User'
    };

    const stubUserService = {
      findByEmail: vi.fn(async () => stubUser),
      updateById: vi.fn(async () => stubUser)
    } as unknown as UserServiceLike;

    const stubAuthService = {
      verify: vi.fn(async (body: unknown) => body),
      authenticate: vi.fn(async () => 'token')
    } as unknown as AuthServiceLike;

    const stubConfigService = {
      get: (key: string) => {
        if (key === 'UPLOAD_DIRECTORY') {
          return path.resolve(process.cwd(), 'upload');
        }
        if (key === 'SALT') {
          return 'salt';
        }
        return '';
      }
    } as unknown as ConfigLike;

    const controller = new LooseUserController(
      new NoopLogger(),
      stubUserService as unknown,
      stubConfigService as unknown,
      stubAuthService as unknown
    );
    primeController(controller as unknown as Record<string, unknown>);

    app.use('/users', controller.router);
    applyErrorHandler(app);

    const res = await request(app).get('/users/signin').expect(200);
    expect(res.body.email).toBe('user@example.com');
  });

  it('GET /users/signin returns 401 when user not found', async () => {
    const app = createTestApp({
      tokenPayload: { email: 'missing@example.com' }
    });

    const stubUserService = {
      findByEmail: vi.fn(async () => null),
      updateById: vi.fn(async () => null)
    } as unknown as UserServiceLike;

    const stubAuthService = {
      verify: vi.fn(async (body: unknown) => body),
      authenticate: vi.fn(async () => 'token')
    } as unknown as AuthServiceLike;

    const stubConfigService = {
      get: (key: string) => {
        if (key === 'UPLOAD_DIRECTORY') {
          return path.resolve(process.cwd(), 'upload');
        }
        if (key === 'SALT') {
          return 'salt';
        }
        return '';
      }
    } as unknown as ConfigLike;

    const controller = new LooseUserController(
      new NoopLogger(),
      stubUserService as unknown,
      stubConfigService as unknown,
      stubAuthService as unknown
    );
    primeController(controller as unknown as Record<string, unknown>);

    app.use('/users', controller.router);
    applyErrorHandler(app);

    await request(app).get('/users/signin').expect(401);
  });

  it('POST /users/logout without token returns 401', async () => {
    const app = createTestApp();

    const stubUserService = {
      findByEmail: vi.fn(async () => null),
      updateById: vi.fn(async () => null)
    } as unknown as UserServiceLike;

    const stubAuthService = {
      verify: vi.fn(async (body: unknown) => body),
      authenticate: vi.fn(async () => 'token')
    } as unknown as AuthServiceLike;

    const stubConfigService = {
      get: (key: string) => {
        if (key === 'UPLOAD_DIRECTORY') {
          return path.resolve(process.cwd(), 'upload');
        }
        if (key === 'SALT') {
          return 'salt';
        }
        return '';
      }
    } as unknown as ConfigLike;

    const controller = new LooseUserController(
      new NoopLogger(),
      stubUserService as unknown,
      stubConfigService as unknown,
      stubAuthService as unknown
    );
    primeController(controller as unknown as Record<string, unknown>);

    app.use('/users', controller.router);
    applyErrorHandler(app);

    await request(app).post('/users/logout').expect(401);
  });

  it('POST /users/logout with token returns 200', async () => {
    const app = createTestApp({ tokenPayload: { email: 'user@example.com' } });

    const stubUserService = {
      findByEmail: vi.fn(async () => null),
      updateById: vi.fn(async () => null)
    } as unknown as UserServiceLike;

    const stubAuthService = {
      verify: vi.fn(async (body: unknown) => body),
      authenticate: vi.fn(async () => 'token')
    } as unknown as AuthServiceLike;

    const stubConfigService = {
      get: (key: string) => {
        if (key === 'UPLOAD_DIRECTORY') {
          return path.resolve(process.cwd(), 'upload');
        }
        if (key === 'SALT') {
          return 'salt';
        }
        return '';
      }
    } as unknown as ConfigLike;

    const controller = new LooseUserController(
      new NoopLogger(),
      stubUserService as unknown,
      stubConfigService as unknown,
      stubAuthService as unknown
    );
    primeController(controller as unknown as Record<string, unknown>);

    app.use('/users', controller.router);
    applyErrorHandler(app);

    const res = await request(app).post('/users/logout').expect(200);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('POST /users/:userId/avatar uploads file and returns 201', async () => {
    const app = createTestApp();
    const uploadDir = ensureDirectory('upload');

    const updateSpy = vi.fn(async () => ({}));
    const stubUserService = {
      findByEmail: vi.fn(async () => null),
      updateById: updateSpy
    } as unknown as UserServiceLike;

    const stubAuthService = {
      verify: vi.fn(async (body: unknown) => body),
      authenticate: vi.fn(async () => 'token')
    } as unknown as AuthServiceLike;

    const stubConfigService = {
      get: (key: string) => {
        if (key === 'UPLOAD_DIRECTORY') {
          return uploadDir;
        }
        if (key === 'SALT') {
          return 'salt';
        }
        return '';
      }
    } as unknown as ConfigLike;

    const controller = new LooseUserController(
      new NoopLogger(),
      stubUserService as unknown,
      stubConfigService as unknown,
      stubAuthService as unknown
    );
    primeController(controller as unknown as Record<string, unknown>);

    app.use('/users', controller.router);
    applyErrorHandler(app);

    const res = await request(app)
      .post('/users/507f1f77bcf86cd799439011/avatar')
      .attach('avatar', Buffer.from('fakeimage'), {
        filename: 'avatar.png',
        contentType: 'image/png'
      })
      .expect(201);

    expect(res.body.filepath).toBeDefined();
    expect(typeof res.body.filepath).toBe('string');
    expect(updateSpy).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      expect.objectContaining({ avatarPath: expect.any(String) })
    );
  });
});
