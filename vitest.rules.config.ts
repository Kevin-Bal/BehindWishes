import { defineConfig } from 'vitest/config'

// Tests des règles Firestore : exécutés contre l'émulateur via `npm run test:rules`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
})
