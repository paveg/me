import { renderToString } from 'react-dom/server';
import { App } from './App';

export type Locale = 'ja' | 'en';

export function render(_locale: Locale): { html: string; head: string } {
  return { html: renderToString(<App />), head: '' };
}
