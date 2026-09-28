import { Router } from 'express';
import { authorize, authenticate } from '@edunet/rbac';
import {
  createParentChildRelationshipHandler,
  getParentChildRelationshipHandler,
  listChildrenHandler,
  listParentsHandler,
  updateParentChildRelationshipHandler,
  deleteParentChildRelationshipHandler,
  getChildEnrollmentsHandler,
  getChildSubmissionsHandler,
} from './handlers';


export function registerRoutes(app: any) {
  const router = Router();

  // Parent-Child Relationship routes
  router.post('/relationships', authenticate, authorize('parent', 'admin'), createParentChildRelationshipHandler);
  router.get('/relationships/:id', authenticate, getParentChildRelationshipHandler);
  router.put('/relationships/:id', authenticate, authorize('parent', 'admin'), updateParentChildRelationshipHandler);
  router.delete('/relationships/:id', authenticate, authorize('parent', 'admin'), deleteParentChildRelationshipHandler);

  // Children and Parents listing
  router.get('/children', authenticate, authorize('parent'), listChildrenHandler);
  router.get('/parents', authenticate, authorize('admin'), listParentsHandler);

  // Child progress for parents
  router.get('/children/:childId/enrollments', authenticate, authorize('parent', 'admin'), getChildEnrollmentsHandler);
  router.get('/children/:childId/submissions', authenticate, authorize('parent', 'admin'), getChildSubmissionsHandler);

  app.use('/api/parents', router);
}
