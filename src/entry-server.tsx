import { renderToString } from 'react-dom/server';
import { App } from './App';
import { buildHead } from './head';

export type Locale = 'ja' | 'en';

export const render = (locale: Locale): { html: string; head: string } => {
  return { html: renderToString(<App locale={locale} />), head: buildHead(locale) };
};
