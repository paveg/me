import { Fragment } from 'react';
import { contacts, siteCopy, type SiteCopy } from '../data/site';
import type { Profile } from '../data/types';
import type { Locale } from '../entry-server';
import { pagePath } from '../head';
import { Icon } from './Icon';

const languages = [
  { locale: 'ja', name: siteCopy.en.ui.switchLanguage },
  { locale: 'en', name: siteCopy.ja.ui.switchLanguage },
] as const;

const socialLinks = [
  { icon: 'github', label: 'GitHub', href: contacts.github },
  { icon: 'x', label: 'X', href: contacts.x },
  { icon: 'linkedin', label: 'LinkedIn', href: contacts.linkedin },
] as const;

const splitAfterCommas = (line: string) => line.split(/(?<=、)/);

export function Hero({
  profile,
  copy,
  locale,
}: {
  profile: Profile;
  copy: SiteCopy;
  locale: Locale;
}) {
  return (
    <header className="hero">
      <nav className="lang" aria-label="Language">
        {languages.map((language) =>
          language.locale === locale ? (
            <span key={language.locale} lang={language.locale} aria-current="page">
              {language.name}
            </span>
          ) : (
            <a key={language.locale} lang={language.locale} href={pagePath(language.locale)}>
              {language.name}
            </a>
          ),
        )}
      </nav>
      <div className="name-row">
        <img className="avatar" src="/profile.jpg" alt="" width="96" height="96" />
        <h1 className="name">{profile.name}</h1>
      </div>
      <p className="title">{copy.title}</p>
      <p className="pitch">
        {copy.pitch.map((line, index) => (
          <Fragment key={line}>
            {index > 0 && <br />}
            {splitAfterCommas(line).map((phrase) => (
              <span key={phrase}>{phrase}</span>
            ))}
          </Fragment>
        ))}
      </p>
      <div className="contact-row">
        <a className="button" href={`mailto:${contacts.email}`}>
          <Icon name="mail" />
          {copy.ui.emailCta}
        </a>
        <div className="icon-links">
          {socialLinks.map((link) => (
            <a key={link.label} className="icon-link" href={link.href} aria-label={link.label}>
              <Icon name={link.icon} />
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
