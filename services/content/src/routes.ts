import { Router } from 'express';
import { authorize, authenticate } from '@edunet/rbac';
import {
  createLessonHandler,
  getLessonHandler,
  listLessonsHandler,
  updateLessonHandler,
  deleteLessonHandler,
  createLessonProgressHandler,
  getLessonProgressHandler,
  listLessonProgressHandler,
  updateLessonProgressHandler,
  deleteLessonProgressHandler,
  createResourceHandler,
  getResourceHandler,
  listResourcesHandler,
  updateResourceHandler,
  deleteResourceHandler,
} from './handlers';


export function registerRoutes(app: any) {
  const router = Router();

  // Lesson routes
  router.post('/lessons', authenticate, authorize('teacher', 'admin'), createLessonHandler);
  router.get('/lessons', authenticate, listLessonsHandler);
  router.get('/lessons/:id', authenticate, getLessonHandler);
  router.put('/lessons/:id', authenticate, authorize('teacher', 'admin'), updateLessonHandler);
  router.delete('/lessons/:id', authenticate, authorize('teacher', 'admin'), deleteLessonHandler);

  // Lesson Progress routes
  router.post('/lesson-progress', authenticate, createLessonProgressHandler);
  router.get('/lesson-progress', authenticate, listLessonProgressHandler);
  router.get('/lesson-progress/:id', authenticate, getLessonProgressHandler);
  router.put('/lesson-progress/:id', authenticate, updateLessonProgressHandler);
  router.delete('/lesson-progress/:id', authenticate, deleteLessonProgressHandler);

  // Resource routes
  router.post('/resources', authenticate, authorize('teacher', 'admin'), createResourceHandler);
  router.get('/resources', authenticate, listResourcesHandler);
  router.get('/resources/:id', authenticate, getResourceHandler);
  router.put('/resources/:id', authenticate, authorize('teacher', 'admin'), updateResourceHandler);
  router.delete('/resources/:id', authenticate, authorize('teacher', 'admin'), deleteResourceHandler);

  app.use('/api/content', router);
}
