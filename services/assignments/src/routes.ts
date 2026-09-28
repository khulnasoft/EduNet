import { Router } from 'express';
import { authorize, authenticate } from '@edunet/rbac';
import {
  createAssignmentHandler,
  getAssignmentHandler,
  listAssignmentsHandler,
  updateAssignmentHandler,
  deleteAssignmentHandler,
} from './handlers';


export function registerRoutes(app: any) {
  const router = Router();

  router.post('/', authenticate, authorize('teacher', 'admin'), createAssignmentHandler);
  router.get('/', authenticate, listAssignmentsHandler);
  router.get('/:id', authenticate, getAssignmentHandler);
  router.put('/:id', authenticate, authorize('teacher', 'admin'), updateAssignmentHandler);
  router.delete('/:id', authenticate, authorize('teacher', 'admin'), deleteAssignmentHandler);

  app.use('/api/assignments', router);
}
