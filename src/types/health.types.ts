export type HealthStatus = 'ok' | 'degraded';

export interface HealthReport {
  readonly service: string;
  readonly status: HealthStatus;
  readonly environment: string;
  readonly uptimeSeconds: number;
  readonly timestamp: string;
}
