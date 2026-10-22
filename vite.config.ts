import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/huozhejiuxing/',
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    assetsInlineLimit: 4096,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
