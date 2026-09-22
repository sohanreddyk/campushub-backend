import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;

  public constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

/**
 * Central error handler. Must be registered last in app.ts (AGENTS.md §3).
 */
export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message =
    error instanceof Error ? error.message : 'Internal server error';

  res.status(statusCode).json({ status: 'error', message });
};
