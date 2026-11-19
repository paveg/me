declare module 'subset-font' {
  export default function subsetFont(
    font: Uint8Array,
    text: string,
    options: { targetFormat: 'woff2'; noLayoutClosure?: boolean },
  ): Promise<Buffer>;
}
