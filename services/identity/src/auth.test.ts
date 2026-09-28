import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { hashPassword, verifyPassword, generateToken, verifyToken } from './auth';

describe('Auth Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify a correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate a token', () => {
      const payload = { userId: '123', role: 'student' };
      const token = generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should generate a refresh token with longer expiry', () => {
      const payload = { userId: '123' };
      const token = generateToken(payload, true);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should verify a valid token', () => {
      const payload = { userId: '123', role: 'student' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('123');
      expect(decoded.role).toBe('student');
    });

    it('should throw on invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });

    it('should throw on expired token', () => {
      const expiredToken = jwt.sign(
        { userId: '123' },
        'test-secret-key',
        { expiresIn: '-1s' }
      );
      expect(() => verifyToken(expiredToken)).toThrow('Invalid token');
    });

    it('should throw on token with wrong secret', () => {
      const wrongToken = jwt.sign(
        { userId: '123' },
        'wrong-secret',
        { expiresIn: '1h' }
      );
      expect(() => verifyToken(wrongToken)).toThrow('Invalid token');
    });
  });
});
