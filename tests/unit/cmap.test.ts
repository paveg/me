import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { missingCharacters, readCodepoints } from '../../scripts/lib/cmap';

test('LINE Seed JPのRegularが価値提案の文字を全部持つ', () => {
  const codepoints = readCodepoints(readFileSync('fonts/src/LINESeedJP-Regular.ttf'));
  expect(
    missingCharacters('成長するSaaSを10年以上、作っては作り直してきました。', codepoints),
  ).toEqual([]);
});

test('フォントにない文字を欠字として返す', () => {
  const codepoints = readCodepoints(readFileSync('fonts/src/LINESeedJP-Regular.ttf'));
  expect(missingCharacters('A😀B', codepoints)).toEqual(['😀']);
});
