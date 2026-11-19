import type { SiteCopy } from '../data/site';
import { Icon } from './Icon';

const GITHUB_ORIGIN = 'https://github.com/';

export function Footer({ copy }: { copy: SiteCopy }) {
  return (
    <footer>
      <div>
        <p>{copy.footerEducation}</p>
        <p>{copy.footerBuiltWith}</p>
      </div>
      <a className="social" href={copy.sourceUrl}>
        <Icon name="github" />
        {copy.sourceUrl.slice(GITHUB_ORIGIN.length)}
      </a>
    </footer>
  );
}
