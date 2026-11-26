import yaml from '@rollup/plugin-yaml';
import { defineConfig } from 'vite';

// BUILD_MONTH=YYYY-MM で経歴の「現在」を固定できる（目盛りの重なりを月ごとに確かめるため）
const buildMonth =
  process.env.BUILD_MONTH ??
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());

export default defineConfig({
  plugins: [yaml()],
  define: { __BUILD_MONTH__: JSON.stringify(buildMonth) },
});
