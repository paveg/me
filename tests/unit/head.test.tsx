import { renderToString } from 'react-dom/server';
import { expect, test } from 'vitest';
import { App } from '../../src/App';
import { buildHead } from '../../src/head';

test('hreflangはja・en・x-defaultの3つ', () => {
  const head = buildHead('ja');
  expect(head).toContain('<link rel="alternate" hreflang="ja" href="https://me.funailog.com/">');
  expect(head).toContain('<link rel="alternate" hreflang="en" href="https://me.funailog.com/en/">');
  expect(head).toContain(
    '<link rel="alternate" hreflang="x-default" href="https://me.funailog.com/">',
  );
});

test('canonicalとOGPはページごとに出し分ける', () => {
  const head = buildHead('en');
  expect(head).toContain('<link rel="canonical" href="https://me.funailog.com/en/">');
  expect(head).toContain('<meta property="og:locale" content="en_US">');
  expect(head).toContain('<meta property="og:url" content="https://me.funailog.com/en/">');
});

test('言語切替は末尾スラッシュ付きのパスを指す', () => {
  expect(renderToString(<App locale="ja" />)).toContain('href="/en/"');
  expect(renderToString(<App locale="en" />)).toContain('href="/"');
});
