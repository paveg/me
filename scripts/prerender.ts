import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Locale } from '../src/entry-server';

type EntryServer = typeof import('../src/entry-server');

const clientDir = resolve('dist/client');
const serverEntry = resolve('dist/server/entry-server.js');

const { render } = (await import(pathToFileURL(serverEntry).href)) as EntryServer;
const template = readFileSync(resolve(clientDir, 'index.html'), 'utf8');

const outputPaths: Record<Locale, string> = {
  ja: resolve(clientDir, 'index.html'),
  en: resolve(clientDir, 'en/index.html'),
};

for (const locale of Object.keys(outputPaths) as Locale[]) {
  const { html, head } = render(locale);
  const page = template
    .replace('%LANG%', locale)
    .replace('<!--app-head-->', head)
    .replace('<!--app-html-->', html);
  const outputPath = outputPaths[locale];
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, page);
}
