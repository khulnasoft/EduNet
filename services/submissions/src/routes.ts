import { Router } from 'express';
import { authorize, authenticate } from '@edunet/rbac';
import {
  createSubmissionHandler,
  getSubmissionHandler,
  listSubmissionsHandler,
  gradeSubmissionHandler,
  deleteSubmissionHandler,
} from './handlers';


export function registerRoutes(app: any) {
  const router = Router();

  router.post('/', authenticate, authorize('student'), createSubmissionHandler);
  router.get('/', authenticate, listSubmissionsHandler);
  router.get('/:id', authenticate, getSubmissionHandler);
  router.put('/:id/grade', authenticate, authorize('teacher', 'admin'), gradeSubmissionHandler);
  router.delete('/:id', authenticate, authorize('student', 'admin'), deleteSubmissionHandler);

  app.use('/api/submissions', router);
}
