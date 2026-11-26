import { renderToString } from 'react-dom/server';
import { App } from './App';
import { NotFound } from './components/NotFound';
import { buildHead, buildNotFoundHead } from './head';

export type Locale = 'ja' | 'en';

export const render = (locale: Locale): { html: string; head: string } => {
  return { html: renderToString(<App locale={locale} />), head: buildHead(locale) };
};

export const renderNotFound = (): { html: string; head: string } => {
  return { html: renderToString(<NotFound />), head: buildNotFoundHead() };
};
