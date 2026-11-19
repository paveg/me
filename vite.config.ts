import yaml from '@rollup/plugin-yaml';
import { defineConfig } from 'vite';

const buildMonth = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
}).format(new Date());

export default defineConfig({
  plugins: [yaml()],
  define: { __BUILD_MONTH__: JSON.stringify(buildMonth) },
});
