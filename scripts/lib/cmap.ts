const UNICODE_PLATFORM = 0;
const WINDOWS_PLATFORM = 3;
const WINDOWS_UNICODE_BMP = 1;
const WINDOWS_UNICODE_FULL = 10;

function findTable(view: DataView, tag: string): number {
  const tableCount = view.getUint16(4);
  for (let index = 0; index < tableCount; index += 1) {
    const record = 12 + index * 16;
    const recordTag = String.fromCharCode(
      ...[0, 1, 2, 3].map((offset) => view.getUint8(record + offset)),
    );
    if (recordTag === tag) return view.getUint32(record + 8);
  }
  throw new Error(`フォントに${tag}テーブルがない`);
}

function readFormat4(view: DataView, start: number, codepoints: Set<number>): void {
  const segmentCount = view.getUint16(start + 6) / 2;
  const endCodes = start + 14;
  const startCodes = endCodes + segmentCount * 2 + 2;
  const idDeltas = startCodes + segmentCount * 2;
  const idRangeOffsets = idDeltas + segmentCount * 2;

  for (let segment = 0; segment < segmentCount; segment += 1) {
    const endCode = view.getUint16(endCodes + segment * 2);
    const startCode = view.getUint16(startCodes + segment * 2);
    const idDelta = view.getUint16(idDeltas + segment * 2);
    const idRangeOffsetAt = idRangeOffsets + segment * 2;
    const idRangeOffset = view.getUint16(idRangeOffsetAt);
    for (let codepoint = startCode; codepoint <= Math.min(endCode, 0xfffe); codepoint += 1) {
      const glyphId =
        idRangeOffset === 0
          ? (codepoint + idDelta) & 0xffff
          : view.getUint16(idRangeOffsetAt + idRangeOffset + (codepoint - startCode) * 2);
      if (glyphId !== 0) codepoints.add(codepoint);
    }
  }
}

function readFormat12(view: DataView, start: number, codepoints: Set<number>): void {
  const groupCount = view.getUint32(start + 12);
  for (let group = 0; group < groupCount; group += 1) {
    const record = start + 16 + group * 12;
    const startCode = view.getUint32(record);
    const endCode = view.getUint32(record + 4);
    const startGlyphId = view.getUint32(record + 8);
    for (let codepoint = startCode; codepoint <= endCode; codepoint += 1) {
      if (startGlyphId + (codepoint - startCode) !== 0) codepoints.add(codepoint);
    }
  }
}

export function readCodepoints(ttf: Uint8Array): Set<number> {
  const view = new DataView(ttf.buffer, ttf.byteOffset, ttf.byteLength);
  const cmap = findTable(view, 'cmap');
  const subtableCount = view.getUint16(cmap + 2);
  const codepoints = new Set<number>();

  for (let index = 0; index < subtableCount; index += 1) {
    const record = cmap + 4 + index * 8;
    const platformId = view.getUint16(record);
    const encodingId = view.getUint16(record + 2);
    const isUnicode =
      platformId === UNICODE_PLATFORM ||
      (platformId === WINDOWS_PLATFORM &&
        (encodingId === WINDOWS_UNICODE_BMP || encodingId === WINDOWS_UNICODE_FULL));
    if (!isUnicode) continue;

    const subtable = cmap + view.getUint32(record + 4);
    const format = view.getUint16(subtable);
    if (format === 4) readFormat4(view, subtable, codepoints);
    else if (format === 12) readFormat12(view, subtable, codepoints);
  }
  return codepoints;
}

const NOT_RENDERED = /[\s\p{Cc}]/u;

export function missingCharacters(text: string, codepoints: Set<number>): string[] {
  const missing = new Set<string>();
  for (const character of text) {
    if (NOT_RENDERED.test(character)) continue;
    if (!codepoints.has(character.codePointAt(0) ?? 0)) missing.add(character);
  }
  return [...missing];
}
