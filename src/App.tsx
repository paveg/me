import type { Locale } from './entry-server';
import { getContent } from './data';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { IconSprite } from './components/IconSprite';
import { Offers } from './components/Offers';
import { Trace } from './components/Trace';
import { Work } from './components/Work';
import { Writing } from './components/Writing';

export function App({ locale }: { locale: Locale }) {
  const { profile, copy } = getContent(locale);
  return (
    <>
      <IconSprite />
      <main className="page">
        <Hero profile={profile.profile} copy={copy} />
        <Trace profile={profile} copy={copy} locale={locale} />
        <Offers copy={copy} />
        <Work projects={profile.projects} locale={locale} />
        <Writing copy={copy} />
        <Contact />
        <Footer copy={copy} />
      </main>
    </>
  );
}
