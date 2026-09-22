import express, { Application, Request, Response } from 'express';

import { apiRouter } from './routes';
import { errorHandler } from './middleware/error.middleware';

/**
 * Builds and configures the Express application.
 * Intentionally does NOT call app.listen() — see src/server.ts (AGENTS.md §2).
 */
export const createApp = (): Application => {
  const app: Application = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/v1', apiRouter);

  app.use((_req: Request, res: Response): void => {
    res.status(404).json({ status: 'error', message: 'Resource not found' });
  });

  app.use(errorHandler);

  return app;
};

export const app: Application = createApp();
