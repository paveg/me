import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('日本語ページがprerenderされている', () => {
  const html = readFileSync('dist/client/index.html', 'utf8');
  expect(html).toContain('<html lang="ja"');
  expect(html).toContain('Ryota Ikezawa</h1>');
});

test('英語ページが/en/index.htmlにprerenderされている', () => {
  const html = readFileSync('dist/client/en/index.html', 'utf8');
  expect(html).toContain('<html lang="en"');
  expect(html).toContain('Ryota Ikezawa</h1>');
});

test('404ページが出力されている', () => {
  expect(existsSync('dist/client/404.html')).toBe(true);
});
