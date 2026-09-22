import { Router } from 'express';

import { getHealth } from '../controllers/health.controller';

export const healthRouter: Router = Router();

// Route definitions and middleware mapping only (AGENTS.md §2).
healthRouter.get('/', getHealth);
