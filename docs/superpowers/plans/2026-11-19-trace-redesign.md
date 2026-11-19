# 職歴トレースの作り直し Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 職歴トレースを、目盛り線・「現在」の線・親子で太さの違うバー・spanの長さ・開始順の並びを持つ表示に作り直し、読み込み時の動きを1本の再生ヘッドにまとめる。

**Architecture:** 位置と長さの計算は`src/lib/trace.ts`の純関数に置き、`Trace.tsx`がprerender時にHTMLへ書き出す。目盛り線と「現在」の線は各行のバーの帯のCSS背景で描く。再生ヘッドは`src/animation/trace.ts`がJSで作り、1つの値を動かして各バーの`scaleX`と`opacity`を計算する。

**Tech Stack:** 既存のまま（Vite 8.3.8、React 19.3.1、TypeScript 7.0.2、anime.js 4.5.0、Vitest 5.1.0、Playwright 1.65.1）。依存は足さない

**Spec:** `docs/superpowers/specs/2026-11-19-trace-redesign-design.md`（親スペック: `docs/superpowers/specs/2026-11-18-portfolio-site-design.md`、モック: `docs/superpowers/specs/mockups/trace-a.html`）

**Branch:** スタックの`v1/trace-redesign`（`v1/fonts`の上）。各タスクはこの層に積む

## Global Constraints

- 依存を足さない。UIライブラリ、CSSフレームワークは入れない
- 色は親スペックのトークンだけ（paper、ink、muted、rule、span、span-soft、open）。書体の太さは400と700だけ。`tabular-nums`と等幅フォントは使わない
- 自動で動くのは読み込み時の1回だけ。自動で動かすのは`transform`と`opacity`だけ。名前と価値提案は動かさない
- 出現のために要素を隠す処理はJSでだけ行い、CSSとprerender済みHTMLに隠す指定を書かない。reduced-motionでは最終状態で止める
- ブラウザに送るJSにReactを含めない。関数の中で`new Date()`を呼ばない（「現在」は`__BUILD_MONTH__`）
- 日本語の文面では半角英数字の前後に空白を入れない。新しい英語のUI文言（"Now"）は叩き台として扱い、公開前に本人の承認を取る
- 横軸は2015〜2027。バーの左端は開始月の初め、右端は終了月の終わり。長さは両端の月を含めて数え、表記は日英とも`3y 8m`・`7m`・`3y`
- コードはすべてTypeScript。lintはoxlint、フォーマットはoxfmt

## Review Focus

- **ビルドの月が軸の外に出る**: 2027年1月以降にビルドすると、続いているspanが軸の右端を越える。ビルドを失敗させて気づけるようにする（Task R1のテストで固定する）
- **短いspanと端数のないspan**: 1か月だけのspanは`1m`、ちょうど12か月は`1y`と書く。`0m`や空文字を出さない（Task R1のテストで固定する）
- **JS無効のときの表示**: 目盛り線、「現在」の線、spanの長さ、終端の点が、prerender済みHTMLだけで見える（Task R3のe2eで固定する）
- **再生中の操作**: 再生ヘッドが動いている間に行を開いても、最後にはすべてのバーが最終状態に落ち着き、ヘッドが消える（Task R3のe2eで固定する）
- **reduced-motion**: 再生ヘッドを作らず、どの要素にもインラインの`transform`や`opacity`を書かない（Task R3のe2eで固定する）

---

### Task R1: 位置・長さ・並び順の計算

**Files:**
- Modify: `src/lib/trace.ts`
- Test: `tests/unit/trace.test.ts`

**Interfaces:**
- Consumes: 既存の`AXIS`、`toYearFraction`、`positionPercent`、`buildTraceRows(data, labels, now)`
- Produces:
  - `endPercent(ym: string): number` — 月の終わり（`toYearFraction(ym) + 1/12`）の軸上の位置（0〜100）
  - `formatDuration(start: string, end: string | null, now: string): string` — 両端の月を含めた長さを`3y 8m`の形で返す。`end`が`null`なら`now`まで
  - `TraceRow`に`duration: string`を足す。`left`は`positionPercent(start)`、`left + width`は`endPercent(end ?? now)`
  - `buildTraceRows`は、会社を`period.start`の古い順に並べ替える（同じ開始月はデータの順）。会社の配下の役割は今のまま開始の古い順で会社の直後。`now`の月の終わりが`AXIS.end`年の1月1日より後なら`Error('Build month <now> is beyond the axis end <AXIS.end>')`を投げる。この比較は月を整数（年×12＋月）にして行う（浮動小数で`endPercent(now) > 100`と比べると、`2026-12`が誤差で落ちることがある）

- [ ] **Step 1: 失敗するテストを書く**（既存の「行の並びと種類」「現職の行は開いたスパンで、渡したnowまで伸びる」を書き換え、次を足す）

```ts
test('行の並びは会社の開始順で、役割は会社の直後', () => {
  const rows = buildTraceRows(getContent('ja').profile, siteCopy.ja.traceLabels, '2026-11');
  expect(rows.map((r) => r.kind)).toEqual(['other', 'parent', 'child', 'child', 'child', 'child', 'child', 'child', 'child', 'other']);
  expect(rows[0]?.label).toBe('エクストップテクノロジー');
  expect(rows[2]?.label).toBe('Software Engineer');
  expect(rows[9]?.label).toBe('ACALL');
});
test('バーの右端は終了月の終わり', () => {
  expect(endPercent('2020-12')).toBe(positionPercent('2021-01'));
  const rows = buildTraceRows(getContent('ja').profile, siteCopy.ja.traceLabels, '2026-11');
  for (const row of rows) expect(row.left + row.width).toBeCloseTo(endPercent(row.end ?? '2026-11'));
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
  expect(rows.map((r) => r.duration)).toEqual(['7m', '11y 1m', '3y 8m', '3y', '9m', '1y 3m', '6m', '1y 5m', '6m', '9m']);
});
test('ビルドの月が軸の右端を越えたらエラーにする', () => {
  const profile = getContent('ja').profile;
  expect(() => buildTraceRows(profile, siteCopy.ja.traceLabels, '2026-12')).not.toThrow();
  expect(() => buildTraceRows(profile, siteCopy.ja.traceLabels, '2027-01')).toThrow('Build month 2027-01 is beyond the axis end 2027');
});
```

- [ ] **Step 2: 失敗を確認する** Run: `pnpm vitest run tests/unit/trace.test.ts` Expected: FAIL（`endPercent`、`formatDuration`がない、並びが違う）
- [ ] **Step 3: `endPercent`、`formatDuration`、`duration`、並べ替え、軸の右端の検査を実装する**
- [ ] **Step 4: 通ることを確認する** Run: `pnpm vitest run tests/unit/trace.test.ts` Expected: PASS（このファイルの全テスト）
- [ ] **Step 5: コミット** `git commit -m "feat: トレースの並びを開始順にし、バーの右端と長さを月の終わりで数える"`

### Task R2: 目盛り線・「現在」の線・長さ・太さの描画

**Files:**
- Modify: `src/components/Trace.tsx`, `src/styles.css`, `src/data/site.ts`
- Test: `tests/unit/render.test.tsx`

**Interfaces:**
- Consumes: Task R1の`endPercent`、`TraceRow.duration`
- Produces（Task R3が使う）:
  - `<section class="trace" style="--now:<endPercent(__BUILD_MONTH__)>%">`（値は小数2桁）
  - 各行の`.track`の中に、`.bar`、続いているspanなら`.open-end`、そして`<span class="duration" aria-hidden="true" style="left:<右端>%">3y 8m</span>`
  - 軸の帯に`<span class="now-label">`（文言は`copy.ui.now`）
  - `SiteCopy.ui`に`now`キーを足す: ja`'現在'`、en`'Now'`

見た目はモック`trace-a.html`に合わせる。決まっている値:
- バーの太さ: parentとotherは14px、childは6px。色は今のまま
- 目盛り線: `.track`（軸の帯を含む）の背景に、`repeating-linear-gradient`で1px幅の`rule`色の線を引く。間隔はデスクトップで`calc(100% / 6)`（2年ごと）、モバイル（`max-width: 40rem`）で`calc(100% / 3)`（4年ごと）
- 「現在」の線: `.track::after`で`left: var(--now)`に`1px dashed`の`muted`色の線
- 余白の列: `.track`に`margin-right`でデスクトップ5.5rem、モバイル4.5rem。バーの位置の割合はこの余白を除いた幅に対するもの
- 長さの文字: バーの右端から0.5rem右、13px、`muted`、太さ400、背景は地の色（点線を切る）、点線より手前（`z-index`）
- 印刷: `.track`の背景（目盛り線）と`.track::after`を消す。長さの文字は残す
- これまでの`.ticks`の目盛りの線の描き方は、上の背景に置き換える。年の数字の`.tick`は残す

- [ ] **Step 1: 失敗するテストを書く**（`tests/unit/render.test.tsx`に足す）

```tsx
test('会社の行は開始順に並ぶ', () => {
  expect(ja.indexOf('class="trace-row other"')).toBeLessThan(ja.indexOf('class="trace-row parent"'));
  expect(ja.lastIndexOf('class="trace-row other"')).toBeGreaterThan(ja.lastIndexOf('class="trace-row child"'));
});
test('各行にspanの長さを書き、支援技術には読ませない', () => {
  expect(ja).toContain('<span class="duration" aria-hidden="true"');
  expect(ja).toMatch(/class="duration"[^>]*>3y 8m</);
  expect(en).toMatch(/class="duration"[^>]*>3y 8m</);
});
test('「現在」の線の位置と文言', () => {
  expect(ja).toMatch(/<section class="trace"[^>]*style="--now:\d+(\.\d+)?%"/);
  expect(ja).toMatch(/class="now-label"[^>]*>現在</);
  expect(en).toMatch(/class="now-label"[^>]*>Now</);
});
```

- [ ] **Step 2: 失敗を確認する** Run: `pnpm vitest run tests/unit/render.test.tsx` Expected: FAIL（新しい3件）
- [ ] **Step 3: `Trace.tsx`、`styles.css`、`site.ts`を実装する**
- [ ] **Step 4: 通ることを確認する** Run: `pnpm vitest run tests/unit/render.test.tsx` Expected: PASS（既存の「隠す指定をHTMLに書かない」を含む全件）
- [ ] **Step 5: 見た目を確かめる** Run: `pnpm build && pnpm exec playwright screenshot --viewport-size=1280,900 --full-page http://localhost:8787/ <scratchpad>/r2-1280.png`（8787で配信中のwrangler devを使う。止まっていれば`pnpm exec wrangler dev --port 8787`で起動）。390px幅も撮り、モック`trace-a.html`と並べて、目盛り線がモバイルでラベルに重ならないこと、長さの文字が点線を切っていることを確かめる
- [ ] **Step 6: コミット** `git commit -m "feat: トレースに目盛り線と現在の線、spanの長さを描く"`

### Task R3: 再生ヘッドの動き

**Files:**
- Modify: `src/animation/trace.ts`, `tests/e2e/site.spec.ts`, `tests/unit/budget.test.ts`（測り直した上限）
- Test: `tests/e2e/site.spec.ts`

**Interfaces:**
- Consumes: Task R2の`--now`、`.bar`、`.open-end`、`.duration`
- Produces: `startTraceAnimation(root: HTMLElement): () => void`（名前と戻り値は今のまま。戻り値はscopeを`revert()`する）

決まっている動き:
- reduced-motionでなければ、`<span class="playhead" aria-hidden="true">`をJSで作って`root`に足す。prerender済みHTMLには置かない
- anime.jsの`animate`で、普通のオブジェクトの値`cursor`を0から`parseFloat(root.style.getPropertyValue('--now'))`まで動かす。目安は`duration: 2600`、`delay: 300`、`ease: 'inOutSine'`（見た目で調整してよい）
- `onUpdate`で、ヘッドを`translateX`で動かし、各バーの`scaleX`を`clamp((cursor - left) / width, 0, 1)`にし、`.duration`と`.open-end`はそのバーの右端を過ぎたら`opacity: 1`、それまでは`0`
- `onComplete`で、バー・長さ・終端の点のインラインの指定を外し、ヘッドを取り除く（浮動小数の誤差で最後の行が出ないことがあるので、最後は必ず最終状態にそろえる）
- これまでの目盛りの`scaleY`の動きと、終端の点の`outElastic`の動きは消す。`<details>`の開閉の動きは今のまま
- reduced-motionのときは何もしない（ヘッドを作らず、インラインの指定も書かない）

- [ ] **Step 1: e2eを新しい動きに合わせて書き換え、足す**（`tests/e2e/site.spec.ts`）
  - `countAnimatedInlineStyles`の対象を`.bar, .open-end, .duration`にする
  - 「JS無効でも全節の本文とバーが見える」に、`.duration`と`.open-end`の最初の要素が見えることを足す
  - 「reduced-motionではバーが最初から最終状態」に、`.playhead`が0個であることを足す
  - 「アニメーション後、バーは最終状態に落ち着く」に、最後に`.playhead`が0個になることを足す
  - 新しいテスト:

```ts
test('再生中に行を開いても、最後は最終状態に落ち着く', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => countAnimatedInlineStyles(page)).toBeGreaterThan(0);
  await page.locator('.trace-row summary').first().click();
  await expect.poll(() => page.locator('.bar').evaluateAll((els) => els.every((el) => ['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(getComputedStyle(el).transform))), { timeout: 10_000 }).toBe(true);
  await expect(page.locator('.playhead')).toHaveCount(0);
  await expect(page.locator('.trace-row').first()).toHaveAttribute('open', '');
});
```

- [ ] **Step 2: 失敗を確認する** Run: `pnpm build && pnpm test:e2e` Expected: FAIL（`.duration`がインラインの指定を持たない、`.playhead`がない、など。どれが落ちたかを記録する）
- [ ] **Step 3: `src/animation/trace.ts`を書き換える**
- [ ] **Step 4: 通ることを確認する** Run: `pnpm build && pnpm test:e2e` Expected: 6 passed
- [ ] **Step 5: reduced-motionの守りが効くことを確かめる** `if (self?.matches.reduceMotion) return;`を一時的に消して`pnpm build && pnpm test:e2e`を実行し、reduced-motionのテストが落ちることを確かめてから戻す
- [ ] **Step 6: 重さを測り直す** `pnpm build`の後に、JSとCSSの実際の大きさが`tests/unit/budget.test.ts`の`BUDGET`を超えていれば、測った値に2割を足した値に書き換える（超えていなければ変えない）。測った値はコミットメッセージに書く
- [ ] **Step 7: 全部通ることを確認する** Run: `pnpm build && pnpm test && pnpm lint && pnpm typecheck && pnpm exec oxfmt --check src tests scripts *.ts *.json && pnpm test:e2e` Expected: すべてexit 0
- [ ] **Step 8: コミット** `git commit -m "feat: トレースの描画を再生ヘッド1本の動きにまとめる"`
