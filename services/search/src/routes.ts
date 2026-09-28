import { Router } from 'express';
import { authenticate } from '@edunet/rbac';
import { searchHandler } from './handlers';

export function registerRoutes(app: any) {
  const router = Router();

  // Search routes
  router.get('/', authenticate, searchHandler);

  app.use('/api/search', router);
}
