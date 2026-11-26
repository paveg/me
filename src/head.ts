import { getContent } from './data';
import { BLOG_URL, contacts } from './data/site';
import type { Locale } from './entry-server';

export const SITE_URL = 'https://me.funailog.com';

const FONT_WEIGHTS = [400, 700];

const PROFILE_IMAGE = '/profile.jpg';
const PROFILE_IMAGE_SIZE = 192;

const OG_LOCALES: Record<Locale, string> = { ja: 'ja_JP', en: 'en_US' };

export const pagePath = (locale: Locale): '/' | '/en/' => {
  return locale === 'ja' ? '/' : '/en/';
};

const pageUrl = (locale: Locale) => `${SITE_URL}${pagePath(locale)}`;

// </script> で閉じられないよう、<をエスケープしてから埋め込む
const toJsonLd = (value: object) => JSON.stringify(value).replaceAll('<', '\\u003c');

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export const buildHead = (locale: Locale): string => {
  const { profile, copy } = getContent(locale);
  const otherLocale: Locale = locale === 'ja' ? 'en' : 'ja';
  const title = escapeHtml(`${profile.profile.name} — ${copy.title}`);
  const description = escapeHtml(copy.pitch.join(locale === 'ja' ? '' : ' '));
  const url = pageUrl(locale);
  const currentEmployer = profile.workExperience.find((work) => work.period.end === null);
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.profile.name,
    jobTitle: copy.title,
    url,
    image: `${SITE_URL}${PROFILE_IMAGE}`,
    sameAs: [contacts.github, contacts.x, contacts.linkedin, BLOG_URL],
    ...(currentEmployer && {
      worksFor: { '@type': 'Organization', name: currentEmployer.company },
    }),
  };

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
    `<meta property="og:image" content="${SITE_URL}${PROFILE_IMAGE}">`,
    `<meta property="og:image:width" content="${PROFILE_IMAGE_SIZE}">`,
    `<meta property="og:image:height" content="${PROFILE_IMAGE_SIZE}">`,
    `<meta name="twitter:card" content="summary">`,
    `<link rel="icon" href="${PROFILE_IMAGE}" type="image/jpeg">`,
    `<link rel="apple-touch-icon" href="${PROFILE_IMAGE}">`,
    `<script type="application/ld+json">${toJsonLd(person)}</script>`,
    ...FONT_WEIGHTS.map(
      (weight) =>
        `<link rel="preload" as="font" type="font/woff2" href="/fonts/line-seed-jp-${weight}.woff2" crossorigin>`,
    ),
  ].join('\n    ');
};

export const buildNotFoundHead = (): string =>
  [
    `<title>404 | ${getContent('ja').profile.profile.name}</title>`,
    `<meta name="robots" content="noindex">`,
    `<link rel="icon" href="${PROFILE_IMAGE}" type="image/jpeg">`,
  ].join('\n    ');
