import 'dotenv/config';

import { app } from './app';
import { env } from './config/env';

const start = (): void => {
  try {
    app.listen(env.port, (): void => {
      console.log(`CampusHub API listening on http://localhost:${env.port}`);
      console.log(`Health check: http://localhost:${env.port}/api/v1/health`);
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown startup error';
    console.error(`Failed to start server: ${message}`);
    process.exit(1);
  }
};

start();
