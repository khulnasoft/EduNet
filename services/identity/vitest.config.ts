import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    reporters: ['basic'],
    // Password hashing is exercised here; cost is lowered in-test rather than
    // relaxing the assertions, so the round-trip is still verified.
    env: {
      BCRYPT_COST: '4',
      NODE_ENV: 'test',
    },
  },
});