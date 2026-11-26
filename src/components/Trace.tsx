import type { CSSProperties } from 'react';
import type { Locale } from '../entry-server';
import type { SiteCopy } from '../data/site';
import type { PortfolioData } from '../data/types';
import {
  axisFor,
  axisTicks,
  buildTraceRows,
  endPercent,
  formatPeriod,
  positionPercent,
  type TraceRow,
} from '../lib/trace';
import { joinLines } from '../lib/text';
import { Icon } from './Icon';

const TICK_STEP_YEARS = 2;

type CustomProperties = CSSProperties & Record<`--${string}`, string>;

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
  const axis = axisFor(__BUILD_MONTH__);
  const rows = buildTraceRows(profile, copy.traceLabels, __BUILD_MONTH__);
  const nowPercent = `${endPercent(__BUILD_MONTH__, axis).toFixed(2)}%`;
  const gridStep = `${((TICK_STEP_YEARS / (axis.end - axis.start)) * 100).toFixed(2)}%`;
  const traceStyle: CustomProperties = { '--now': nowPercent, '--grid-step': gridStep };
  return (
    <section className="trace" aria-labelledby="trace-heading" style={traceStyle}>
      <h2 id="trace-heading">{copy.ui.traceHeading}</h2>
      <p className="trace-hint">{copy.traceHint}</p>
      <div className="axis" aria-hidden="true">
        <div className="ticks">
          {axisTicks(axis, TICK_STEP_YEARS).map((year, index) => (
            <span
              key={year}
              className={index % 2 === 1 ? 'tick minor' : 'tick'}
              style={
                { '--x': `${positionPercent(`${year}-01`, axis).toFixed(2)}%` } as CustomProperties
              }
            >
              {year}
            </span>
          ))}
          <span className="now-label" style={{ left: nowPercent }}>
            {copy.ui.now}
          </span>
        </div>
      </div>
      {rows.map((row) => {
        const rightEdge = `${(row.left + row.width).toFixed(2)}%`;
        return (
          <details key={row.key} className={`trace-row ${row.kind}`}>
            <summary>
              <span className="label">
                <Icon name="caret" className="caret" />
                <span className="label-text">
                  <span className="role">{row.label}</span>
                  <span className="period">
                    {formatPeriod(row.start, row.end, copy.ui.present)}
                  </span>
                  <small>{row.sub}</small>
                </span>
              </span>
              <span className="track">
                <span
                  className="bar"
                  style={{ left: `${row.left.toFixed(2)}%`, width: `${row.width.toFixed(2)}%` }}
                />
                {row.isOpen && <span className="open-end" style={{ left: rightEdge }} />}
                <span className="duration" aria-hidden="true" style={{ left: rightEdge }}>
                  {row.duration}
                </span>
              </span>
            </summary>
            <TraceDetail row={row} locale={locale} />
          </details>
        );
      })}
    </section>
  );
}
