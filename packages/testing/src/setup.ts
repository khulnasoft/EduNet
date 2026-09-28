import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

export const testUtils = {
  createMockRequest(overrides: any = {}) {
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
    const res: any = {
      statusCode: 200,
      body: undefined,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.body = data;
        return this;
      },
    };
    return res;
  },

  createMockNext() {
    return vi.fn();
  },

  generateTestToken(payload: any, secret = 'test-secret') {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, secret, { expiresIn: '1h' });
  },
};

export { describe, it, expect, beforeEach, afterEach, vi };
