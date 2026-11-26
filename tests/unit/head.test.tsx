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

test('共有時の画像とfaviconはプロフィール画像を絶対URLで指す', () => {
  for (const locale of ['ja', 'en'] as const) {
    const head = buildHead(locale);
    expect(head).toContain(
      '<meta property="og:image" content="https://me.funailog.com/profile.jpg">',
    );
    expect(head).toContain('<link rel="icon" href="/profile.jpg" type="image/jpeg">');
    expect(head).toContain('<link rel="apple-touch-icon" href="/profile.jpg">');
  }
});

const readPersonJsonLd = (head: string) => {
  const match = head.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  if (!match?.[1]) throw new Error('JSON-LDが無い');
  return JSON.parse(match[1]);
};

test('JSON-LDで人物とSNSのつながりを検索エンジンに伝える', () => {
  const person = readPersonJsonLd(buildHead('en'));
  expect(person).toMatchObject({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Ryota Ikezawa',
    url: 'https://me.funailog.com/en/',
    image: 'https://me.funailog.com/profile.jpg',
    worksFor: { '@type': 'Organization', name: 'freee K.K.' },
  });
  expect(person.sameAs).toEqual(
    expect.arrayContaining(['https://github.com/paveg', 'https://funailog.com']),
  );
});
