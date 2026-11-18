import type { Locale } from '../entry-server';
import type { SiteCopy } from '../data/site';
import type { PortfolioData } from '../data/types';
import {
  axisTicks,
  buildTraceRows,
  formatPeriod,
  positionPercent,
  type TraceRow,
} from '../lib/trace';
import { joinLines } from '../lib/text';
import { Icon } from './Icon';

const TICK_STEP_YEARS = 2;

function TraceDetail({ row, locale }: { row: TraceRow; locale: Locale }) {
  return (
    <div className="detail">
      <p className="meta">{row.role}</p>
      <p>{joinLines(row.description, locale)}</p>
      {row.star.map((star) => (
        <div className="star" key={star.situation}>
          <p>{joinLines(star.situation, locale)}</p>
          <p>{joinLines(star.task, locale)}</p>
          <p>{joinLines(star.action, locale)}</p>
          <p>{joinLines(star.result, locale)}</p>
        </div>
      ))}
      {row.technologies.length > 0 && (
        <ul className="tags">
          {row.technologies.map((technology) => (
            <li key={technology}>{technology}</li>
          ))}
        </ul>
      )}
      {row.links.length > 0 && (
        <ul className="links">
          {row.links.map((link) => (
            <li key={link.url}>
              <a href={link.url}>{link.label}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Trace({
  profile,
  copy,
  locale,
}: {
  profile: PortfolioData;
  copy: SiteCopy;
  locale: Locale;
}) {
  const rows = buildTraceRows(profile, copy.traceLabels, __BUILD_MONTH__);
  return (
    <section className="trace" aria-label={copy.ui.traceHeading}>
      <p className="trace-hint">{copy.traceHint}</p>
      <div className="axis">
        <div className="ticks">
          {axisTicks(TICK_STEP_YEARS).map((year) => (
            <span key={year} className="tick" style={{ left: `${positionPercent(`${year}-01`)}%` }}>
              {year}
            </span>
          ))}
        </div>
      </div>
      {rows.map((row) => (
        <details key={row.key} className={`trace-row ${row.kind}`}>
          <summary>
            <span className="label">
              <Icon name="caret" className="caret" />
              <span className="label-text">
                <span className="role">{row.label}</span>
                <span className="period">{formatPeriod(row.start, row.end, copy.ui.present)}</span>
                <small>{row.sub}</small>
              </span>
            </span>
            <span className="track">
              <span
                className="bar"
                style={{ left: `${row.left.toFixed(2)}%`, width: `${row.width.toFixed(2)}%` }}
              />
              {row.isOpen && (
                <span
                  className="open-end"
                  style={{ left: `${(row.left + row.width).toFixed(2)}%` }}
                />
              )}
            </span>
          </summary>
          <TraceDetail row={row} locale={locale} />
        </details>
      ))}
    </section>
  );
}
