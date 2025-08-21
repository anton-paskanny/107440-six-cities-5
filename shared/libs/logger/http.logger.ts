import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';

export function createHttpLogger() {
  return pinoHttp({
    genReqId: (req, res) => {
      const headerId = req.headers['x-request-id'];
      const id =
        (Array.isArray(headerId) ? headerId[0] : headerId) || randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customProps: (req) => ({ requestId: req.id }),
    autoLogging: true
  });
}
