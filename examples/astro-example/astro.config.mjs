import { defineConfig } from 'astro/config';
import CivetPlugin from '../../dist/index.mjs';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [CivetPlugin.vite({})],
  },
});
