import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const includeDebug = mode !== 'production' || process.env.VITE_INCLUDE_DEBUG === 'true';
  return {
    base: process.env.VITE_BASE || '/',
    define: {
      __INCLUDE_DEBUG__: JSON.stringify(includeDebug),
    },
    resolve: {
      alias: [
        {
          find: '@huo/debug-panel',
          replacement: resolve(
            process.cwd(),
            includeDebug ? 'src/ui/debug-panel.ts' : 'src/ui/debug-panel.prod.ts',
          ),
        },
      ],
    },
    build: {
      target: 'es2022',
      cssCodeSplit: false,
      assetsInlineLimit: 4096,
    },
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
    },
  };
});
