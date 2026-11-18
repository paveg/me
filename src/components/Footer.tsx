import type { SiteCopy } from '../data/site';

export function Footer({ copy }: { copy: SiteCopy }) {
  return (
    <footer>
      <p>{copy.footerEducation}</p>
      <p>
        {copy.footerBuiltWith}
        <a href={copy.sourceUrl}>{copy.ui.sourceCode}</a>
      </p>
    </footer>
  );
}
