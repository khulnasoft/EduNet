import { Router } from 'express';
import { authorize, authenticate } from '@edunet/rbac';
import {
  createEnrollmentHandler,
  getEnrollmentHandler,
  listEnrollmentsHandler,
  updateEnrollmentHandler,
  deleteEnrollmentHandler,
} from './handlers';


export function registerRoutes(app: any) {
  const router = Router();

  router.post('/', authenticate, authorize('student', 'admin'), createEnrollmentHandler);
  router.get('/', authenticate, listEnrollmentsHandler);
  router.get('/:id', authenticate, getEnrollmentHandler);
  router.put('/:id', authenticate, authorize('teacher', 'admin'), updateEnrollmentHandler);
  router.delete('/:id', authenticate, authorize('student', 'admin'), deleteEnrollmentHandler);

  app.use('/api/enrollments', router);
}
