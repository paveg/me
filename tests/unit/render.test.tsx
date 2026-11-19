import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { expect, test } from 'vitest';
import { App } from '../../src/App';

const ja = renderToString(<App locale="ja" />);
const en = renderToString(<App locale="en" />);

test('節が設計どおりの順に並ぶ', () => {
  const order = [
    'class="hero"',
    'class="trace"',
    'id="offers"',
    'id="work"',
    'id="writing"',
    'id="contact"',
    '<footer',
  ];
  const positions = order.map((marker) => ja.indexOf(marker));
  expect(positions.every((p) => p >= 0)).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
});

test('トレースは10行の<details>で、期間を文字でも出す', () => {
  expect(ja.match(/<details class="trace-row/g)).toHaveLength(10);
  expect(ja).toContain('2019.07 – 2022.06');
});

test('価値提案と連絡先', () => {
  expect(ja).toContain('成長するSaaSを10年以上、');
  expect(ja).toContain('href="mailto:pavegy@gmail.com"');
  expect(ja).toContain('href="https://www.linkedin.com/in/xpav"');
});

test('Writingの記事と、funailogへの案内', () => {
  expect(ja).toContain('グローバルチーム開発での経験とその取り組み');
  expect(ja).toContain('funailogで記事をもっと読む');
});

test('アイコンは名前より前にあり、alt=""', () => {
  expect(ja.indexOf('class="avatar"')).toBeLessThan(ja.indexOf('class="name"'));
  expect(ja).toMatch(/<img[^>]*class="avatar"[^>]*alt=""/);
});

test('隠す指定をHTMLに書かない', () => {
  expect(ja).not.toMatch(/opacity:\s*0|visibility:\s*hidden/);
});

test('英語版は英語の価値提案を出す', () => {
  expect(en).toContain('From product design to the platform it runs on.');
});

test('トレースの節に見出しを出し、節の名前にする', () => {
  expect(ja).toMatch(
    /<section class="trace" aria-labelledby="trace-heading"[^>]*><h2 id="trace-heading">経歴<\/h2><p class="trace-hint"/,
  );
  expect(en).toMatch(
    /<section class="trace" aria-labelledby="trace-heading"[^>]*><h2 id="trace-heading">Career<\/h2><p class="trace-hint"/,
  );
});

test('印刷用のスタイルが閉じた<details>の中身を出す', () => {
  const css = readFileSync('src/styles.css', 'utf8');
  expect(css).toContain('@media print');
  expect(css).toContain('::details-content');
});

test('会社の行は開始順に並ぶ', () => {
  expect(ja.indexOf('class="trace-row other"')).toBeLessThan(
    ja.indexOf('class="trace-row parent"'),
  );
  expect(ja.lastIndexOf('class="trace-row other"')).toBeGreaterThan(
    ja.lastIndexOf('class="trace-row child"'),
  );
});

test('各行にspanの長さを書き、支援技術には読ませない', () => {
  expect(ja).toContain('<span class="duration" aria-hidden="true"');
  expect(ja).toMatch(/class="duration"[^>]*>3y 8m</);
  expect(en).toMatch(/class="duration"[^>]*>3y 8m</);
});

test('「現在」の線の位置と文言', () => {
  expect(ja).toMatch(/<section class="trace"[^>]*style="--now:\d+(\.\d+)?%;/);
  expect(ja).toMatch(/class="now-label"[^>]*>現在</);
  expect(en).toMatch(/class="now-label"[^>]*>Now</);
});

test('目盛り線の間隔を軸と刻みから計算して書く', () => {
  expect(ja).toMatch(/<section class="trace"[^>]*style="[^"]*--grid-step:16\.67%/);
});

test('モバイルで隠す目盛りは2017・2021・2025だけ', () => {
  const minorYears = [...ja.matchAll(/class="tick minor"[^>]*>(\d{4})</g)].map((m) => m[1]);
  expect(minorYears).toEqual(['2017', '2021', '2025']);
  expect(ja.match(/class="tick"/g)).toHaveLength(3);
});

test('軸は支援技術に読ませない', () => {
  expect(ja).toContain('<div class="axis" aria-hidden="true">');
});

test('ヒーローのXのリンクはアイコンだけで、名前はaria-labelで伝える', () => {
  const xLink = /<a class="social"[^>]*href="https:\/\/x\.com\/paveg_"[^>]*>([\s\S]*?)<\/a>/.exec(
    ja,
  );
  expect(xLink?.[0]).toContain('aria-label="X"');
  expect(xLink?.[1]?.replace(/<svg[\s\S]*?<\/svg>/g, '')).toBe('');
});
