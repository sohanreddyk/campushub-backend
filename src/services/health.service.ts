import { HealthReport } from '../types/health.types';
import { env } from '../config/env';

/**
 * Pure business logic. No Express types cross this boundary (AGENTS.md §2).
 */
export const buildHealthReport = async (): Promise<HealthReport> => {
  return Promise.resolve({
    service: 'campushub-backend',
    status: 'ok',
    environment: env.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};
