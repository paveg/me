import { expect, test } from 'vitest';
import { getContent } from '../../src/data/index';
import { siteCopy } from '../../src/data/site';
import {
  axisTicks,
  buildTraceRows,
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

test('行の並びと種類', () => {
  const rows = buildTraceRows(getContent('ja').profile, siteCopy.ja.traceLabels, '2026-11');
  expect(rows.map((r) => r.kind)).toEqual([
    'parent',
    'child',
    'child',
    'child',
    'child',
    'child',
    'child',
    'child',
    'other',
    'other',
  ]);
  expect(rows[1]?.label).toBe('Software Engineer');
});

test('現職の行は開いたスパンで、渡したnowまで伸びる', () => {
  const rows = buildTraceRows(getContent('ja').profile, siteCopy.ja.traceLabels, '2026-11');
  const current = rows.filter((r) => r.isOpen);
  expect(current).toHaveLength(2);
  for (const row of current) expect(row.left + row.width).toBeCloseTo(positionPercent('2026-11'));
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
