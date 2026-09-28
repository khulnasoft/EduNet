/**
 * Canonical role-based access control for EduNet.
 *
 * Every service MUST import authorization from this package so that role
 * semantics (in particular the admin superuser rule) cannot drift between
 * services. Divergent copies of `authorize()` previously allowed some services
 * to reject admins on teacher-only routes while others allowed them.
 */

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

type MinimalRequest = { user?: AuthenticatedUser };
type MinimalResponse = {
  status(code: number): MinimalResponse;
  json(body: unknown): unknown;
};
type NextFunction = (err?: unknown) => void;

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
