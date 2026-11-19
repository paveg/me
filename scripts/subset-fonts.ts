import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import subsetFont from 'subset-font';
import { missingCharacters, readCodepoints } from './lib/cmap';

const clientDir = resolve('dist/client');
const pagePaths = [resolve(clientDir, 'index.html'), resolve(clientDir, 'en/index.html')];
const weights = [
  { weight: 400, source: resolve('fonts/src/LINESeedJP-Regular.ttf') },
  { weight: 700, source: resolve('fonts/src/LINESeedJP-Bold.ttf') },
];

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity, name: string) => {
    if (name.startsWith('#x') || name.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
    }
    if (name.startsWith('#')) return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
    const decoded = NAMED_ENTITIES[name.toLowerCase()];
    if (decoded === undefined) throw new Error(`未対応のHTMLエンティティ: ${entity}`);
    return decoded;
  });
}

function visibleText(html: string): string {
  const title = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? '';
  const body = /<body[^>]*>([\s\S]*)<\/body>/.exec(html)?.[1] ?? '';
  const withoutNonText = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');
  return decodeEntities(`${title}\n${withoutNonText.replace(/<[^>]*>/g, '\n')}`);
}

const text = pagePaths.map((path) => visibleText(readFileSync(path, 'utf8'))).join('\n');

const fonts = weights.map(({ weight, source }) => ({
  weight,
  ttf: readFileSync(source),
}));

const missing = fonts.flatMap(({ weight, ttf }) =>
  missingCharacters(text, readCodepoints(ttf)).map((character) => `${character} (${weight})`),
);
if (missing.length > 0) {
  console.error(`LINE Seed JPにない文字があります: ${missing.join(' ')}`);
  process.exit(1);
}

// noLayoutClosureはGSUBで置き換わる先のグリフを外すので、fi・flの合字は文字コードで残す
const LIGATURES = 'ﬁﬂ';

const fontsDir = resolve(clientDir, 'fonts');
mkdirSync(fontsDir, { recursive: true });
for (const { weight, ttf } of fonts) {
  const woff2 = await subsetFont(ttf, `${text}${LIGATURES}`, {
    targetFormat: 'woff2',
    noLayoutClosure: true,
  });
  writeFileSync(resolve(fontsDir, `line-seed-jp-${weight}.woff2`), woff2);
}
