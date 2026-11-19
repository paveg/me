import type { SiteCopy } from '../data/site';

const FUNAILOG_URL = 'https://funailog.com';

export function Writing({ copy }: { copy: SiteCopy }) {
  return (
    <section id="writing">
      <h2>Writing &amp; Talks</h2>
      <ol className="writing">
        {copy.writing.map((entry) => (
          <li key={entry.url}>
            <time dateTime={entry.date}>{entry.year}</time>
            <div>
              <a href={entry.url}>{entry.title}</a>
              <p>{entry.media}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="more">
        <a href={FUNAILOG_URL}>{copy.moreWritingLabel}</a>
      </p>
    </section>
  );
}
