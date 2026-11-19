import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

// pnpm buildの後に実行する（build-output.test.tsと同じ）
const BUDGET = { js: 46_000, css: 8_300, font: 102_000, image: 13_200 };

function filesWithExtension(dir: string, extension: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith(extension))
    .map((path) => join(dir, path));
}

const jsFiles = (dir: string) => filesWithExtension(dir, '.js');

const totalBytes = (dir: string, extension: string) =>
  filesWithExtension(dir, extension).reduce((sum, file) => sum + statSync(file).size, 0);

test('ブラウザに送るJSにReactが含まれない', () => {
  const js = jsFiles('dist/client')
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
  expect(js).not.toMatch(/react-dom|__reactContainer|__reactFiber/);
});

test('ビルド結果がそれぞれの上限以下', () => {
  expect(totalBytes('dist/client', '.js')).toBeLessThanOrEqual(BUDGET.js);
  expect(totalBytes('dist/client', '.css')).toBeLessThanOrEqual(BUDGET.css);
  for (const file of ['line-seed-jp-400.woff2', 'line-seed-jp-700.woff2']) {
    expect(statSync(`dist/client/fonts/${file}`).size).toBeLessThanOrEqual(BUDGET.font);
  }
  expect(statSync('dist/client/profile.jpg').size).toBeLessThanOrEqual(BUDGET.image);
});
