import { describe, it, expect, vi } from 'vitest';
import {
  ROLES,
  hasRole,
  authorize,
  assertSameOrganization,
} from './index';

function mockRes() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

describe('hasRole', () => {
  it('allows an explicitly listed role', () => {
    expect(hasRole(ROLES.TEACHER, ['teacher', 'admin'])).toBe(true);
  });

  it('denies an unlisted role', () => {
    expect(hasRole(ROLES.STUDENT, ['teacher'])).toBe(false);
  });

  it('lets admin bypass role restrictions', () => {
    expect(hasRole(ROLES.ADMIN, ['teacher'])).toBe(true);
  });

  it('does not escalate an unknown role to admin', () => {
    expect(hasRole('superadmin', ['teacher'])).toBe(false);
  });

  it('denies a missing role', () => {
    expect(hasRole(undefined, ['teacher'])).toBe(false);
  });
});

describe('authorize middleware', () => {
  it('returns 401 when unauthenticated', () => {
    const req = { user: undefined };
    const res = mockRes();
    const next = vi.fn();

    authorize('teacher')(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for the wrong role', () => {
    const req = { user: { id: 'u1', role: ROLES.STUDENT } };
    const res = mockRes();
    const next = vi.fn();

    authorize('teacher')(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for an allowed role', () => {
    const req = { user: { id: 'u1', role: ROLES.TEACHER } };
    const res = mockRes();
    const next = vi.fn();

    authorize('teacher')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next for admin on a teacher-only route', () => {
    const req = { user: { id: 'u1', role: ROLES.ADMIN } };
    const res = mockRes();
    const next = vi.fn();

    authorize('teacher')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('assertSameOrganization', () => {
  it('permits matching organizations', () => {
    expect(
      assertSameOrganization({ id: 'u1', role: ROLES.TEACHER, organizationId: 'org-a' }, 'org-a'),
    ).toBe(true);
  });

  it('denies cross-organization access', () => {
    expect(
      assertSameOrganization({ id: 'u1', role: ROLES.TEACHER, organizationId: 'org-a' }, 'org-b'),
    ).toBe(false);
  });

  it('denies even for admin across organizations', () => {
    expect(
      assertSameOrganization({ id: 'u1', role: ROLES.ADMIN, organizationId: 'org-a' }, 'org-b'),
    ).toBe(false);
  });

  it('denies when either side is missing', () => {
    expect(assertSameOrganization({ id: 'u1', role: ROLES.TEACHER }, 'org-a')).toBe(false);
    expect(
      assertSameOrganization({ id: 'u1', role: ROLES.TEACHER, organizationId: 'org-a' }, undefined),
    ).toBe(false);
  });
});
