import { Router } from 'express';
import { authorize, authenticate } from '@edunet/rbac';
import {
  getUserHandler,
  listUsersHandler,
  updateUserHandler,
  updatePasswordHandler,
  verifyUserHandler,
  deleteUserHandler,
} from './handlers';


export function registerRoutes(app: any) {
  const router = Router();

  router.get('/', authenticate, authorize('admin', 'teacher'), listUsersHandler);
  router.get('/:id', authenticate, getUserHandler);
  router.put('/:id', authenticate, authorize('admin'), updateUserHandler);
  router.put('/:id/password', authenticate, updatePasswordHandler);
  router.put('/:id/verify', authenticate, authorize('admin'), verifyUserHandler);
  router.delete('/:id', authenticate, authorize('admin'), deleteUserHandler);

  app.use('/api/users', router);
}
