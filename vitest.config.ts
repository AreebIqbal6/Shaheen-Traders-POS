import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e/**', 'tests/e2e/**'],
    globals: true,
    environment: 'happy-dom',
  },
});
