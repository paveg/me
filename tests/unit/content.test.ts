import { expect, test } from 'vitest';
import { getContent } from '../../src/data';

test('WorkにAttainが含まれない', () => {
  for (const locale of ['ja', 'en'] as const) {
    expect(getContent(locale).profile.projects.map((p) => p.name)).not.toContain('Attain');
  }
});

test('すべての役割と会社に行ラベルがある', () => {
  for (const locale of ['ja', 'en'] as const) {
    const { profile, copy } = getContent(locale);
    const keys = profile.workExperience.flatMap((w) => [
      w.company,
      ...(w.roles ?? []).map((r) => r.project!),
    ]);
    expect(keys.filter((k) => !copy.traceLabels[k])).toEqual([]);
  }
});
