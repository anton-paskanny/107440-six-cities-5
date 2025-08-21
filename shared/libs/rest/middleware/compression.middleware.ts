import { NextFunction, Request, Response } from 'express';
import compression from 'compression';
import { Middleware } from './middleware.interface.js';

const ALLOW_COMPRESS_MIME = new Set<string>([
  'text/html',
  'text/css',
  'application/javascript',
  'application/json',
  'image/svg+xml'
]);

const DENY_COMPRESS_MIME = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'application/zip',
  'application/pdf'
]);

function shouldCompress(_req: Request, res: Response): boolean {
  const contentTypeHeader = res.getHeader('Content-Type');
  if (!contentTypeHeader) {
    return false;
  }

  const mime = String(contentTypeHeader).split(';')[0].trim().toLowerCase();
  if (DENY_COMPRESS_MIME.has(mime)) {
    return false;
  }

  return ALLOW_COMPRESS_MIME.has(mime);
}

export class CompressionMiddleware implements Middleware {
  private handler = compression({ filter: shouldCompress });

  public execute(req: Request, res: Response, next: NextFunction): void {
    this.handler(req, res, next);
  }
}
