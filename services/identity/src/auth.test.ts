import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
} from './auth';

const TEST_SECRET = 'test-secret-key';

describe('Auth service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, JWT_SECRET: TEST_SECRET, NODE_ENV: 'test' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('password hashing', () => {
    it('hashes a password', async () => {
      const hash = await hashPassword('testPassword123');
      expect(hash).toBeDefined();
      expect(hash).not.toBe('testPassword123');
    });

    it('accepts the correct password', async () => {
      const hash = await hashPassword('testPassword123');
      expect(await verifyPassword('testPassword123', hash)).toBe(true);
    });

    it('rejects an incorrect password', async () => {
      const hash = await hashPassword('testPassword123');
      expect(await verifyPassword('wrongPassword', hash)).toBe(false);
    });

    it('salts so identical passwords hash differently', async () => {
      expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
    });
  });

  describe('secret resolution', () => {
    it('refuses to sign without JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      expect(() =>
        generateAccessToken({ userId: '1', role: 'student', organizationId: 'o1' }),
      ).toThrow('JWT_SECRET is not configured');
    });

    it('refuses the placeholder secret in production', () => {
      process.env.JWT_SECRET = 'your-secret-key-change-in-production';
      process.env.NODE_ENV = 'production';
      expect(() =>
        generateAccessToken({ userId: '1', role: 'student', organizationId: 'o1' }),
      ).toThrow(/placeholder/i);
    });

    it('allows the placeholder outside production for local dev', () => {
      process.env.JWT_SECRET = 'your-secret-key-change-in-production';
      process.env.NODE_ENV = 'development';
      expect(() =>
        generateAccessToken({ userId: '1', role: 'student', organizationId: 'o1' }),
      ).not.toThrow();
    });
  });

  describe('access tokens', () => {
    it('round-trips the claims', () => {
      const token = generateAccessToken({ userId: 'u1', role: 'teacher', organizationId: 'o1' });
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe('u1');
      expect(decoded.role).toBe('teacher');
      expect(decoded.organizationId).toBe('o1');
      expect(decoded.tokenKind).toBe('access');
    });

    it('rejects a malformed token', () => {
      expect(() => verifyToken('not-a-token')).toThrow('Invalid token');
    });

    it('rejects an expired token', () => {
      const token = jwt.sign({ userId: 'u1', tokenKind: 'access' }, TEST_SECRET, { expiresIn: '-1s' });
      expect(() => verifyToken(token)).toThrow('Invalid token');
    });

    it('rejects a token signed with another secret', () => {
      const token = jwt.sign({ userId: 'u1', tokenKind: 'access' }, 'other-secret', { expiresIn: '1h' });
      expect(() => verifyToken(token)).toThrow('Invalid token');
    });
  });

  describe('token kind confusion', () => {
    it('rejects a refresh token used as an access token', () => {
      const refreshToken = generateRefreshToken({ userId: 'u1' });
      expect(() => verifyToken(refreshToken)).toThrow('Invalid token');
    });

    it('rejects an access token used to refresh', () => {
      const accessToken = generateAccessToken({ userId: 'u1', role: 'student', organizationId: 'o1' });
      expect(() => verifyRefreshToken(accessToken)).toThrow('Invalid token');
    });

    it('rejects a legacy token with no tokenKind claim', () => {
      const legacy = jwt.sign({ userId: 'u1' }, TEST_SECRET, { expiresIn: '1h' });
      expect(() => verifyToken(legacy)).toThrow('Invalid token');
      expect(() => verifyRefreshToken(legacy)).toThrow('Invalid token');
    });
  });

  describe('refresh tokens', () => {
    it('round-trips the user id', () => {
      const token = generateRefreshToken({ userId: 'u1' });
      expect(verifyRefreshToken(token).userId).toBe('u1');
    });

    it('outlives an access token', () => {
      const access = verifyToken(
        generateAccessToken({ userId: 'u1', role: 'student', organizationId: 'o1' }),
      );
      const refresh = verifyRefreshToken(generateRefreshToken({ userId: 'u1' }));
      expect(refresh.exp! - refresh.iat!).toBeGreaterThan(access.exp! - access.iat!);
    });
  });
});
