import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify('test'),
    __BUILD_TIME__: JSON.stringify('1970-01-01T00:00:00.000Z'),
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.emulator.test.ts'],
          setupFiles: ['src/test/setup.ts'],
        },
      },
      {
        // Needs the Firestore emulator; run through `npm run test:emulator`
        extends: true,
        test: {
          name: 'emulator',
          environment: 'node',
          include: ['src/**/*.emulator.test.ts'],
          fileParallelism: false,
          testTimeout: 15_000,
        },
      },
    ],
  },
})
