import { Router } from 'express';
import { authorize, authenticate } from '@edunet/rbac';
import {
  getCourseAnalyticsHandler,
  getStudentPerformanceHandler,
  getAssignmentPerformanceHandler,
  getCourseEngagementHandler,
} from './handlers';


export function registerRoutes(app: any) {
  const router = Router();

  // Course Analytics routes
  router.get('/courses/:courseId/analytics', authenticate, authorize('teacher', 'admin'), getCourseAnalyticsHandler);
  router.get('/courses/:courseId/analytics/students', authenticate, authorize('teacher', 'admin'), getStudentPerformanceHandler);
  router.get('/courses/:courseId/analytics/assignments', authenticate, authorize('teacher', 'admin'), getAssignmentPerformanceHandler);
  router.get('/courses/:courseId/analytics/engagement', authenticate, authorize('teacher', 'admin'), getCourseEngagementHandler);

  app.use('/api/analytics', router);
}
