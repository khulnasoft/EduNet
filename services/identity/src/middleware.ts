import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    organizationId?: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    req.user = {
      id: payload.userId,
      role: payload.role,
      organizationId: payload.organizationId,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export { authorize } from '@edunet/rbac';
