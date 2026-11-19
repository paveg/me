import { getContent } from './data';
import type { Locale } from './entry-server';

export const SITE_URL = 'https://me.funailog.com';

const OG_LOCALES: Record<Locale, string> = { ja: 'ja_JP', en: 'en_US' };

export function pagePath(locale: Locale): '/' | '/en/' {
  return locale === 'ja' ? '/' : '/en/';
}

const pageUrl = (locale: Locale) => `${SITE_URL}${pagePath(locale)}`;

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export function buildHead(locale: Locale): string {
  const { profile, copy } = getContent(locale);
  const otherLocale: Locale = locale === 'ja' ? 'en' : 'ja';
  const title = escapeHtml(`${profile.profile.name} — ${copy.title}`);
  const description = escapeHtml(copy.pitch.join(locale === 'ja' ? '' : ' '));
  const url = pageUrl(locale);

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<link rel="canonical" href="${url}">`,
    `<link rel="alternate" hreflang="ja" href="${pageUrl('ja')}">`,
    `<link rel="alternate" hreflang="en" href="${pageUrl('en')}">`,
    `<link rel="alternate" hreflang="x-default" href="${pageUrl('ja')}">`,
    `<meta property="og:type" content="profile">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:locale" content="${OG_LOCALES[locale]}">`,
    `<meta property="og:locale:alternate" content="${OG_LOCALES[otherLocale]}">`,
    `<meta name="twitter:card" content="summary">`,
  ].join('\n    ');
}
