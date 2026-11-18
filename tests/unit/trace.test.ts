import { expect, test } from 'vitest';
import { getContent } from '../../src/data/index';
import { siteCopy } from '../../src/data/site';
import {
  axisTicks,
  buildTraceRows,
  endPercent,
  formatDuration,
  formatPeriod,
  positionPercent,
  toYearFraction,
} from '../../src/lib/trace';

test('位置は軸の範囲に対する割合', () => {
  expect(positionPercent('2015-01')).toBe(0);
  expect(positionPercent('2021-01')).toBe(50);
});

test('書式違反の期間はエラーにする', () => {
  expect(() => toYearFraction('2019/07')).toThrow('Invalid period: 2019/07');
});

test('行の並びは会社の開始順で、役割は会社の直後', () => {
  const rows = buildTraceRows(getContent('ja').profile, siteCopy.ja.traceLabels, '2026-11');
  expect(rows.map((r) => r.kind)).toEqual([
    'other',
    'parent',
    'child',
    'child',
    'child',
    'child',
    'child',
    'child',
    'child',
    'other',
  ]);
  expect(rows[0]?.label).toBe('エクストップテクノロジー');
  expect(rows[2]?.label).toBe('Software Engineer');
  expect(rows[9]?.label).toBe('ACALL');
});

test('現職の行は開いたスパンで、渡したnowの月の終わりまで伸びる', () => {
  const rows = buildTraceRows(getContent('ja').profile, siteCopy.ja.traceLabels, '2026-11');
  const current = rows.filter((r) => r.isOpen);
  expect(current).toHaveLength(2);
  for (const row of current) expect(row.left + row.width).toBeCloseTo(endPercent('2026-11'));
});

test('バーの右端は終了月の終わり', () => {
  expect(endPercent('2020-12')).toBe(positionPercent('2021-01'));
  const rows = buildTraceRows(getContent('ja').profile, siteCopy.ja.traceLabels, '2026-11');
  for (const row of rows)
    expect(row.left + row.width).toBeCloseTo(endPercent(row.end ?? '2026-11'));
});

test('長さは両端の月を含めて数える', () => {
  expect(formatDuration('2015-04', '2015-10', '2026-11')).toBe('7m');
  expect(formatDuration('2015-11', '2019-06', '2026-11')).toBe('3y 8m');
  expect(formatDuration('2019-07', '2022-06', '2026-11')).toBe('3y');
  expect(formatDuration('2015-11', null, '2026-11')).toBe('11y 1m');
  expect(formatDuration('2020-05', '2020-05', '2026-11')).toBe('1m');
  expect(formatDuration('2020-01', '2020-12', '2026-11')).toBe('1y');
});

test('各行に長さが入る', () => {
  const rows = buildTraceRows(getContent('ja').profile, siteCopy.ja.traceLabels, '2026-11');
  expect(rows.map((r) => r.duration)).toEqual([
    '7m',
    '11y 1m',
    '3y 8m',
    '3y',
    '9m',
    '1y 3m',
    '6m',
    '1y 5m',
    '6m',
    '9m',
  ]);
});

test('ビルドの月が軸の右端を越えたらエラーにする', () => {
  const profile = getContent('ja').profile;
  expect(() => buildTraceRows(profile, siteCopy.ja.traceLabels, '2026-12')).not.toThrow();
  expect(() => buildTraceRows(profile, siteCopy.ja.traceLabels, '2027-01')).toThrow(
    'Build month 2027-01 is beyond the axis end 2027',
  );
});

test('期間の表示', () => {
  expect(formatPeriod('2019-07', '2022-06', '現在')).toBe('2019.07 – 2022.06');
  expect(formatPeriod('2026-06', null, '現在')).toBe('2026.06 – 現在');
});

test('目盛り', () => {
  expect(axisTicks(2)).toEqual([2015, 2017, 2019, 2021, 2023, 2025]);
  expect(axisTicks(4)).toEqual([2015, 2019, 2023]);
});

test('ビルド月はYYYY-MM形式でdefineから埋め込まれる', () => {
  expect(__BUILD_MONTH__).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
});

test('会社の開始が書式違反ならbuildTraceRowsはエラーにする', () => {
  const profile = structuredClone(getContent('ja').profile);
  profile.workExperience[1]!.period.start = '2019/07';
  expect(() => buildTraceRows(profile, siteCopy.ja.traceLabels, '2026-11')).toThrow(
    'Invalid period: 2019/07',
  );
});

test('役割の開始が書式違反ならbuildTraceRowsはエラーにする', () => {
  const profile = structuredClone(getContent('ja').profile);
  profile.workExperience[0]!.roles![0]!.period.start = '2019/07';
  expect(() => buildTraceRows(profile, siteCopy.ja.traceLabels, '2026-11')).toThrow(
    'Invalid period: 2019/07',
  );
});

test('会社のラベルがなければ、そのキーを示してエラーにする', () => {
  const profile = getContent('ja').profile;
  const { ACALL株式会社: _removed, ...labels } = siteCopy.ja.traceLabels;
  expect(() => buildTraceRows(profile, labels, '2026-11')).toThrow(
    'Missing trace label: ACALL株式会社',
  );
});

test('役割のラベルがなければ、そのキーを示してエラーにする', () => {
  const profile = getContent('ja').profile;
  const { データ集約機能: _removed, ...labels } = siteCopy.ja.traceLabels;
  expect(() => buildTraceRows(profile, labels, '2026-11')).toThrow(
    'Missing trace label: データ集約機能',
  );
});
