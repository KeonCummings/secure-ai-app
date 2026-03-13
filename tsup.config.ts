import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
  },
  {
    entry: ['bin/secure-ai-app.ts'],
    format: ['esm'],
    outDir: 'dist/bin',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
