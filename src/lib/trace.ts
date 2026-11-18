import type { TraceLabel } from '../data/site';
import type { Link, PortfolioData, Star } from '../data/types';

export const AXIS = { start: 2015, end: 2027 };

export type TraceRow = {
  key: string;
  kind: 'parent' | 'child' | 'other';
  label: string;
  sub: string;
  start: string;
  end: string | null;
  left: number;
  width: number;
  duration: string;
  isOpen: boolean;
  role: string;
  description: string;
  technologies: string[];
  links: Link[];
  star: Star[];
};

const YEAR_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function toYearFraction(ym: string): number {
  const match = YEAR_MONTH.exec(ym);
  if (!match) throw new Error(`Invalid period: ${ym}`);
  return Number(match[1]) + (Number(match[2]) - 1) / 12;
}

export function positionPercent(ym: string): number {
  return ((toYearFraction(ym) - AXIS.start) / (AXIS.end - AXIS.start)) * 100;
}

export function endPercent(ym: string): number {
  return ((toYearFraction(ym) + 1 / 12 - AXIS.start) / (AXIS.end - AXIS.start)) * 100;
}

function toMonthCount(ym: string): number {
  const match = YEAR_MONTH.exec(ym);
  if (!match) throw new Error(`Invalid period: ${ym}`);
  return Number(match[1]) * 12 + Number(match[2]);
}

export function formatDuration(start: string, end: string | null, now: string): string {
  const months = toMonthCount(end ?? now) - toMonthCount(start) + 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years > 0 ? `${years}y` : '', rest > 0 ? `${rest}m` : ''].filter(Boolean).join(' ');
}

function findLabel(labels: Record<string, TraceLabel>, key: string | undefined): TraceLabel {
  const label = key === undefined ? undefined : labels[key];
  if (!label) throw new Error(`Missing trace label: ${key}`);
  return label;
}

type RowSource = Pick<
  TraceRow,
  'key' | 'kind' | 'start' | 'end' | 'role' | 'description' | 'technologies' | 'links' | 'star'
>;

function toRow(source: RowSource, label: TraceLabel, now: string): TraceRow {
  const left = positionPercent(source.start);
  const right = endPercent(source.end ?? now);
  return {
    ...source,
    label: label.label,
    sub: label.sub,
    left,
    width: right - left,
    duration: formatDuration(source.start, source.end, now),
    isOpen: source.end === null,
  };
}

export function buildTraceRows(
  data: PortfolioData,
  labels: Record<string, TraceLabel>,
  now: string,
): TraceRow[] {
  if (toMonthCount(now) > AXIS.end * 12) {
    throw new Error(`Build month ${now} is beyond the axis end ${AXIS.end}`);
  }
  const rows: TraceRow[] = [];
  const oldestFirstCompanies = [...data.workExperience].sort((a, b) =>
    a.period.start.localeCompare(b.period.start),
  );
  for (const company of oldestFirstCompanies) {
    const roles = company.roles ?? [];
    rows.push(
      toRow(
        {
          key: company.company,
          kind: roles.length > 0 ? 'parent' : 'other',
          start: company.period.start,
          end: company.period.end,
          role: company.role,
          description: company.description,
          technologies: company.technologies ?? [],
          links: [],
          star: company.star ?? [],
        },
        findLabel(labels, company.company),
        now,
      ),
    );
    const oldestFirst = [...roles].sort((a, b) => a.period.start.localeCompare(b.period.start));
    for (const role of oldestFirst) {
      rows.push(
        toRow(
          {
            key: `${company.company}/${role.project}`,
            kind: 'child',
            start: role.period.start,
            end: role.period.end,
            role: role.role,
            description: role.description,
            technologies: role.technologies ?? [],
            links: role.links ?? [],
            star: role.star ?? [],
          },
          findLabel(labels, role.project),
          now,
        ),
      );
    }
  }
  return rows;
}

export function formatPeriod(start: string, end: string | null, presentLabel: string): string {
  return `${start.replace('-', '.')} – ${end === null ? presentLabel : end.replace('-', '.')}`;
}

export function axisTicks(step: number): number[] {
  const ticks: number[] = [];
  for (let year = AXIS.start; year < AXIS.end; year += step) ticks.push(year);
  return ticks;
}
