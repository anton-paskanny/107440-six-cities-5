import express, { NextFunction, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { Logger } from '../libs/logger/index.js';

export class NoopLogger implements Logger {
  info(): void {}
  warn(): void {}
  error(): void {}
  debug(): void {}
  child(): Logger {
    return this;
  }
}

export function primeController(controller: Record<string, unknown>) {
  (controller as Record<string, unknown>).pathTranformer = {
    execute: (d: Record<string, unknown>) => d
  };
}

export function createTestApp(options?: {
  tokenPayload?: Record<string, unknown>;
}) {
  const app = express();
  app.use(express.json());

  if (options?.tokenPayload) {
    app.use((req, _res, next) => {
      (req as unknown as Record<string, unknown>).tokenPayload =
        options.tokenPayload;
      next();
    });
  }

  return app;
}

export function applyErrorHandler(app: ReturnType<typeof createTestApp>) {
  app.use(
    (
      err: Error & { httpStatusCode?: number },
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      res.status(err?.httpStatusCode ?? 500).json({ error: err?.message });
    }
  );
}

export function ensureDirectory(dir: string) {
  const absolute = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(absolute)) {
    fs.mkdirSync(absolute, { recursive: true });
  }
  return absolute;
}
