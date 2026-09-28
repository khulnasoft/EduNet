import { Router } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import {
  getUserHandler,
  listUsersHandler,
  updateUserHandler,
  updatePasswordHandler,
  verifyUserHandler,
  deleteUserHandler,
} from './handlers';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    organizationId?: string;
  };
}

function authenticate(req: AuthRequest, res: any, next: any) {
  try {
    const headers = req.headers as any;
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.user = {
      id: payload.userId as string,
      role: payload.role as string,
      organizationId: payload.organizationId as string,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

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
