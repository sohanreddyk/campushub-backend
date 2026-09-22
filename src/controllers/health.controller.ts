import { Request, Response, NextFunction } from 'express';

import { buildHealthReport } from '../services/health.service';
import { HealthReport } from '../types/health.types';

export const getHealth = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const report: HealthReport = await buildHealthReport();
    res.status(200).json({ status: 'success', data: report });
  } catch (error: unknown) {
    next(error);
  }
};
