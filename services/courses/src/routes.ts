import { Router } from 'express';
import { authorize, authenticate } from '@edunet/rbac';
import {
  createCourseHandler,
  getCourseHandler,
  listCoursesHandler,
  updateCourseHandler,
  deleteCourseHandler,
  publishCourseHandler,
  unpublishCourseHandler,
} from './handlers';


export function registerRoutes(app: any) {
  const router = Router();

  router.post('/', authenticate, authorize('teacher', 'admin'), createCourseHandler);
  router.get('/', authenticate, listCoursesHandler);
  router.get('/:id', authenticate, getCourseHandler);
  router.put('/:id', authenticate, authorize('teacher', 'admin'), updateCourseHandler);
  router.post('/:id/publish', authenticate, authorize('teacher', 'admin'), publishCourseHandler);
  router.post('/:id/unpublish', authenticate, authorize('teacher', 'admin'), unpublishCourseHandler);
  router.delete('/:id', authenticate, authorize('teacher', 'admin'), deleteCourseHandler);

  app.use('/api/courses', router);
}
