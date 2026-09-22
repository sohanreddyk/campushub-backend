export interface AppEnv {
  readonly port: number;
  readonly nodeEnv: string;
  readonly mongoUri: string;
}

const parsePort = (value: string | undefined, fallback: number): number => {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return parsed;
};

export const env: AppEnv = {
  port: parsePort(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/campushub',
};
