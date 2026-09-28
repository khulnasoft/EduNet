import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';

export const testUtils = {
  createMockRequest(overrides: Record<string, unknown> = {}) {
    return {
      headers: {},
      body: {},
      params: {},
      query: {},
      user: undefined,
      ...overrides,
    };
  },

  createMockResponse() {
    const res: {
      statusCode: number;
      body: unknown;
      status(code: number): typeof res;
      json(data: unknown): typeof res;
    } = {
      statusCode: 200,
      body: undefined,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: unknown) {
        this.body = data;
        return this;
      },
    };
    return res;
  },

  createMockNext() {
    return vi.fn();
  },

  generateTestToken(payload: Record<string, unknown>, secret = 'test-secret') {
    return jwt.sign(payload, secret, { expiresIn: '1h' });
  },
};

export { describe, it, expect, beforeEach, afterEach, vi };
