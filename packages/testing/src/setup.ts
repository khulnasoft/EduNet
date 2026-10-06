import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import jwt from 'jsonwebtoken';

export interface MockResponse {
  statusCode: number;
  body: unknown;
  status(code: number): MockResponse;
  json(data: unknown): MockResponse;
}

export interface TestUtils {
  createMockRequest(overrides?: Record<string, unknown>): Record<string, unknown>;
  createMockResponse(): MockResponse;
  createMockNext(): Mock;
  generateTestToken(payload: Record<string, unknown>, secret?: string): string;
}

/**
 * Explicit annotation is required: without it TypeScript infers a type that
 * reaches into Vitest's internal `@vitest/spy` path, which is not portable
 * across Vitest versions (TS2742).
 */
export const testUtils: TestUtils = {
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

  createMockResponse(): MockResponse {
    return {
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
  },

  createMockNext() {
    return vi.fn();
  },

  generateTestToken(payload: Record<string, unknown>, secret = 'test-secret') {
    return jwt.sign(payload, secret, { expiresIn: '1h' });
  },
};

export { describe, it, expect, beforeEach, afterEach, vi };
