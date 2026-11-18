import yaml from '@rollup/plugin-yaml';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [yaml()],
});
