import { Router } from 'express';
import { authorize, authenticate } from '@edunet/rbac';
import {
  createOrganizationHandler,
  getOrganizationHandler,
  updateOrganizationHandler,
  listOrganizationsHandler
} from './handlers';


export function registerRoutes(app: any) {
  const router = Router();

  router.post('/', authenticate, authorize('admin'), createOrganizationHandler);
  router.get('/', authenticate, listOrganizationsHandler);
  router.get('/:id', authenticate, getOrganizationHandler);
  router.put('/:id', authenticate, authorize('admin'), updateOrganizationHandler);

  app.use('/api/organizations', router);
}
