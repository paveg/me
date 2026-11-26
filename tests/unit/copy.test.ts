import { expect, test } from 'vitest';
import { getContent } from '../../src/data';
import { siteCopy } from '../../src/data/site';

const JA_ALNUM_SPACE =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー、。] [A-Za-z0-9]|[A-Za-z0-9] [\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}、。]/u;

const collectStrings = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
};

test('日本語の文面に、半角英数字の前後の空白がない', () => {
  const strings = [...collectStrings(getContent('ja').profile), ...collectStrings(siteCopy.ja)];
  expect(strings.filter((s) => JA_ALNUM_SPACE.test(s))).toEqual([]);
});

test('「PjM」が残っていない', () => {
  expect(collectStrings(getContent('ja')).filter((s) => s.includes('PjM'))).toEqual([]);
});

test('価値提案が承認済みの文言のまま', () => {
  expect(siteCopy.ja.pitch).toEqual([
    'プロダクトの設計から、それを動かす基盤まで。',
    '成長するSaaSを10年以上、作っては作り直してきました。',
  ]);
});
