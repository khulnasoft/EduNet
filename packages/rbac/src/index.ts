/**
 * Canonical role-based access control and request authentication for EduNet.
 *
 * Every service MUST import authentication and authorization from this package.
 * Eleven services previously carried their own copy of `authenticate()`,
 * including a hardcoded fallback JWT secret and inconsistent admin semantics.
 * Centralising them removes the duplicate secret and the drift.
 */

import jwt, { JwtPayload } from 'jsonwebtoken';

export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  PARENT: 'parent',
  TUTOR: 'tutor',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Roles that bypass role checks entirely.
 *
 * Admins are organisation-scoped operational staff, not superusers over the
 * whole installation: tenant isolation is enforced separately by
 * `assertSameOrganization` / ownership checks, never by the role gate.
 */
export const PRIVILEGED_ROLES: readonly string[] = [ROLES.ADMIN];

export interface AuthenticatedUser {
  id: string;
  role: string;
  organizationId?: string;
}

/** True when `userRole` is explicitly allowed, or is a privileged role. */
export function hasRole(userRole: string | undefined, allowedRoles: readonly string[]): boolean {
  if (!userRole) return false;
  if (PRIVILEGED_ROLES.includes(userRole)) return true;
  return allowedRoles.includes(userRole);
}

type MinimalRequest = { user?: AuthenticatedUser; headers?: Record<string, unknown> };
type MinimalResponse = {
  status(code: number): MinimalResponse;
  json(body: unknown): unknown;
};
type NextFunction = (err?: unknown) => void;

/**
 * Resolves the signing secret, refusing to fall back to a hardcoded value.
 *
 * A hardcoded fallback previously let a deployment that forgot to configure
 * JWT_SECRET sign tokens with a publicly known key.
 */
export function resolveSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim().length === 0) {
    throw new Error('JWT_SECRET is not configured');
  }

  if (process.env.NODE_ENV === 'production' && secret === 'your-secret-key-change-in-production') {
    throw new Error('JWT_SECRET must be changed from its placeholder value in production');
  }

  return secret;
}

/** Claims the identity service puts on an access token. */
export interface AccessTokenClaims extends JwtPayload {
  userId: string;
  role: string;
  organizationId: string;
}

/**
 * Express middleware that verifies the bearer access token and populates
 * `req.user`. Rejects missing, malformed, expired, wrong-secret and
 * refresh-token requests with 401.
 */
export function authenticate(req: MinimalRequest, res: MinimalResponse, next: NextFunction): void {
  const authHeader = req.headers?.authorization;

  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const claims = jwt.verify(authHeader.substring(7), resolveSecret()) as AccessTokenClaims;

    // Access tokens are issued with tokenKind='access'; refuse refresh tokens.
    if (claims.tokenKind !== 'access') {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = {
      id: claims.userId,
      role: claims.role,
      organizationId: claims.organizationId,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Express middleware factory enforcing that the authenticated user holds one
 * of `allowedRoles`. Privileged roles always pass.
 */
export function authorize(...allowedRoles: string[]) {
  return (req: MinimalRequest, res: MinimalResponse, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!hasRole(req.user.role, allowedRoles)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Enforces tenant isolation. Administrators are still confined to their own
 * organization; only an explicitly cross-tenant permission may pass.
 */
export function assertSameOrganization(
  user: AuthenticatedUser | undefined,
  targetOrganizationId: string | undefined,
): boolean {
  if (!user?.organizationId || !targetOrganizationId) return false;
  return user.organizationId === targetOrganizationId;
}
