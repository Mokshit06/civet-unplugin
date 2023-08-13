import { defineConfig } from 'tsup';

export default defineConfig({
  entryPoints: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: true,
  platform: 'node',
  external: ['typescript', 'lz-string', '@danielx/civet', '@typescript/vfs'],
});
