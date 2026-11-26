import type { Locale } from '../entry-server';

export const joinLines = (text: string, locale: Locale): string => {
  return text.trim().replace(/\s*\n\s*/g, locale === 'ja' ? '' : ' ');
};
