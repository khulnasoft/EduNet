import { Router } from 'express';
import { authorize, authenticate } from '@edunet/rbac';
import {
  createNotificationHandler,
  getNotificationHandler,
  listNotificationsHandler,
  markAsReadHandler,
  markAllAsReadHandler,
  deleteNotificationHandler,
  getNotificationPreferencesHandler,
  updateNotificationPreferencesHandler,
} from './handlers';


export function registerRoutes(app: any) {
  const router = Router();

  // Notification routes
  router.post('/notifications', authenticate, authorize('admin'), createNotificationHandler);
  router.get('/notifications', authenticate, listNotificationsHandler);
  router.get('/notifications/:id', authenticate, getNotificationHandler);
  router.put('/notifications/:id/read', authenticate, markAsReadHandler);
  router.put('/notifications/read-all', authenticate, markAllAsReadHandler);
  router.delete('/notifications/:id', authenticate, deleteNotificationHandler);

  // Notification Preferences routes
  router.get('/preferences', authenticate, getNotificationPreferencesHandler);
  router.put('/preferences', authenticate, updateNotificationPreferencesHandler);

  app.use('/api/notifications', router);
}
