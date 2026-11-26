import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const css = readFileSync('src/styles.css', 'utf8');

const LIGHT_BLOCK = /^:root\s*\{([^}]*)\}/m;
const DARK_BLOCK = /@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/;
const HEX_TOKEN = /--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi;

const parseTokens = (block: string | undefined) =>
  Object.fromEntries([...(block ?? '').matchAll(HEX_TOKEN)].map((m) => [m[1]!, m[2]!]));

const readTokens = (theme: string): Record<string, string> => {
  const light = parseTokens(LIGHT_BLOCK.exec(css)?.[1]);
  if (theme === 'light') return light;
  return { ...light, ...parseTokens(DARK_BLOCK.exec(css)?.[1]) };
};

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};

const contrast = (foreground: string, background: string): number => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter! + 0.05) / (darker! + 0.05);
};

test.each(['light', 'dark'])('%s: 本文は4.5:1以上、意味を持つ図形は3:1以上', (theme) => {
  const t = readTokens(theme);
  expect(contrast(t.ink!, t.paper!)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(t.muted!, t.paper!)).toBeGreaterThanOrEqual(4.5);
  for (const key of ['span', 'span-soft', 'open']) {
    expect(contrast(t[key]!, t.paper!)).toBeGreaterThanOrEqual(3);
  }
});

test('ダークのトークンはライトと別の値を読んでいる', () => {
  expect(readTokens('dark').paper).not.toBe(readTokens('light').paper);
});
