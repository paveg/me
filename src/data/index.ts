import type { Locale } from '../entry-server';
import jaProfile from './profile.ja.yml';
import enProfile from './profile.en.yml';
import { siteCopy, type SiteCopy } from './site';
import type { PortfolioData } from './types';

const profiles: Record<Locale, PortfolioData> = {
  ja: jaProfile as PortfolioData,
  en: enProfile as PortfolioData,
};

export function getContent(locale: Locale): { profile: PortfolioData; copy: SiteCopy } {
  const profile = profiles[locale];
  return {
    profile: { ...profile, projects: profile.projects.filter((p) => p.name !== 'Attain') },
    copy: siteCopy[locale],
  };
}
