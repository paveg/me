import { renderToString } from 'react-dom/server';
import { App } from './App';

export type Locale = 'ja' | 'en';

export function render(locale: Locale): { html: string; head: string } {
  return { html: renderToString(<App locale={locale} />), head: '' };
}
