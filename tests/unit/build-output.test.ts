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

test('404ページはサイトのCSSを読み、日英それぞれのトップへ戻れる', () => {
  expect(existsSync('dist/client/404.html')).toBe(true);
  const html = readFileSync('dist/client/404.html', 'utf8');
  expect(html).toMatch(/<link rel="stylesheet"[^>]*href="\/assets\/index-[\w-]+\.css"/);
  expect(html).toContain('<meta name="robots" content="noindex">');
  expect(html).toMatch(/<a href="\/"[^>]*>トップへ戻る<\/a>/);
  expect(html).toMatch(/<div lang="en"[^>]*>[\s\S]*<a href="\/en\/"[^>]*>/);
});
