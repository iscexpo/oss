import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['lib/v0-platform/**/*.ts'],
      exclude: ['**/*.d.ts', '**/index.ts'],
      thresholds: { statements: 99, branches: 99, functions: 99, lines: 99 },
    },
  },
})
