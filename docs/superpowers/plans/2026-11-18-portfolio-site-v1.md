# me.funailog.comポートフォリオサイトv1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 日英2ページのポートフォリオサイトを、ビルド時にprerenderした静的HTMLとしてCloudflare Workers（`me.funailog.com`）に公開する。

**Architecture:** Vite + React 19で、クライアント用とSSR用の2つのビルドを作る。`scripts/prerender.ts`がSSRビルドの`render(locale)`を呼んで`dist/client/index.html`と`dist/client/en/index.html`を書き出し、クライアントは`hydrateRoot`でハイドレーションする。経歴データはYAMLのまま持ち、`@rollup/plugin-yaml`でビルド時にJSモジュールへ変換する。動きはanime.js v4の`createScope`を`useEffect`内で使う。

**Tech Stack:** pnpm、Vite 8.3.8、React 19.3.1、TypeScript 7.0.2、anime.js 4.5.0、@rollup/plugin-yaml 5.0.1、Vitest 5.1.0、Playwright 1.65.1 + @axe-core/playwright 4.14.0、Lighthouse 13.6.0、oxlint 1.94.0、oxfmt 0.79.0、wrangler 4.164.0、tsx 4.23.15

**Spec:** `docs/superpowers/specs/2026-11-18-portfolio-site-design.md`（モック: `docs/superpowers/specs/mockups/mockup.html`）

## Global Constraints

- 配信はWorkers static assetsのみ。Workerのエントリ（`main`）は書かない
- UIライブラリ、CSSフレームワークは入れない。素のCSSとカスタムプロパティ
- 依存は上記Tech Stackのものだけ。追加が必要になったら実装を止めて相談する
- 日本語の文面では半角英数字の前後に空白を入れない。「PjM」は「プロジェクトマネージャー」。「フルスタック」は使わない
- 価値提案（承認済み、文言を変えない）: ja「プロダクトの設計から、それを動かす基盤まで。成長するSaaSを10年以上、作っては作り直してきました。」／ en "From product design to the platform it runs on. Over a decade of building, and rebuilding, a growing SaaS."
- 色トークン（ライト）: paper `#FBFCFD`、ink `#1C2733`、muted `#5B6B7C`、rule `#DCE2E9`、span `#2E6BD6`、span-soft `#7090C2`、open `#B07200`。ダーク: paper `#14212F`、ink `#E6ECF2`、muted `#9AABBD`、rule `#2A3B4F`、span `#6FA0F2`、span-soft `#5A7AAE`、open `#F2B544`
- 書体はIBM Plex Sans JP（400/500/600）。年や期間は`font-variant-numeric: tabular-nums`で、等幅フォントは使わない
- 自動で動くのは読み込み時のトレース描画1回だけ。名前と価値提案は動かさない。reduced-motionでは全要素を最終状態で表示する
- 出現アニメのために要素を隠す処理はJSでだけ行い、CSSとprerender済みHTMLに隠す指定を書かない
- careerリポジトリの情報（応募状況・年収など）は一切載せない
- 文面（「頼めること」、トレースの2段目、UI文言の英語版）は叩き台として実装し、公開前に本人の承認を得る
- デプロイは実行直前に本人の確認を取る

## Review Focus

- **ハイドレーションの不一致**: 「現在」の月をクライアントで`new Date()`から取ると、prerenderしたHTMLと食い違う。ビルド時の月をViteの`define`で埋め込み、サーバーとクライアントで同じ値を使う（Task 3のテストで固定する）
- **英語ページのリンク**: `/en`はWorkersで`/en/`へ307転送される。言語切替や内部リンクは最初から`/en/`と`/`を指すこと（Task 5のテストで固定する）
- **期間データの書式違反**: profile.ymlの`period.start`が`YYYY-MM`でないと、バーの位置が`NaN`になって静かに崩れる。ビルドを失敗させる（Task 3のテストで固定する）
- **JS無効や読み込み失敗時の表示**: anime.jsのCDN障害やJSエラーでも、本文とバーはprerender済みHTMLだけで読める状態にする（Task 6のe2eで固定する）
- **キーボード操作**: トレースの各行は`<summary>`なので、Tab移動とEnter/Spaceで開閉でき、フォーカス表示が見えること（Task 7のe2eで固定する）

---

## File Structure

```
package.json, pnpm-lock.yaml, tsconfig.json, vite.config.ts, vitest.config.ts,
playwright.config.ts, .oxlintrc.json, wrangler.json, index.html
public/profile.jpg                 プロフィールアイコン（192×192に縮小）
public/404.html                    静的な404ページ
scripts/prerender.ts               SSRビルドを呼んでHTMLを書き出す
src/entry-client.tsx               hydrateRoot
src/entry-server.tsx               render(locale)
src/App.tsx                        ページ全体の組み立て
src/head.ts                        buildHead(locale): <title>・meta・OGP・hreflang
src/styles.css                     トークンと全スタイル
src/data/profile.ja.yml            funailogからコピー（PjMを置換）
src/data/profile.en.yml            funailogからコピー
src/data/types.ts                  PortfolioData型（funailogのzodスキーマから移植）
src/data/site.ts                   日英の文面（価値提案・頼めること・トレースの行ラベル・Writing・連絡先・UI文言）
src/data/index.ts                  getContent(locale)
src/lib/trace.ts                   トレースの位置計算と行の組み立て（純関数）
src/components/{Hero,Trace,Offers,Work,Writing,Contact,Footer,IconSprite}.tsx
src/hooks/useTraceAnimation.ts     anime.jsによる描画と開閉アニメーション
tests/unit/*.test.ts(x)            Vitest
tests/e2e/site.spec.ts             Playwright
```

---

### Task 1: 土台とprerenderのパイプライン

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `.oxlintrc.json`, `wrangler.json`, `index.html`, `src/entry-client.tsx`, `src/entry-server.tsx`, `src/App.tsx`, `scripts/prerender.ts`, `public/404.html`
- Test: `tests/unit/build-output.test.ts`

**Interfaces:**
- Produces: `type Locale = 'ja' | 'en'`（`src/entry-server.tsx`からexport）、`render(locale: Locale): { html: string; head: string }`。`index.html`は`<html lang="%LANG%">`、`<!--app-head-->`、`<div id="root"><!--app-html--></div>`の3つのプレースホルダを持つ
- `package.json`のscripts: `dev`（vite）、`build`（`vite build --outDir dist/client && vite build --ssr src/entry-server.tsx --outDir dist/server && tsx scripts/prerender.ts`）、`preview`（`wrangler dev`）、`lint`（`oxlint`）、`fmt`（`oxfmt`）、`fmt:check`（`oxfmt --check`）、`typecheck`（`tsc --noEmit`）、`test`（`vitest run`）、`test:e2e`（`playwright test`）
- `wrangler.json`: `name: "portfolio"`、`compatibility_date: "2026-11-01"`、`assets: { directory: "./dist/client", not_found_handling: "404-page" }`。`routes`はTask 8で足す
- `.oxlintrc.json`: pluginsに`react`、`jsx-a11y`、`typescript`を有効にする

- [ ] **Step 1: 依存を入れて設定ファイルを置く**（Tech Stackのバージョンを固定する。`App`は`<main><h1>Ryota Ikezawa</h1></main>`だけ）
- [ ] **Step 2: 失敗するテストを書く**

```ts
// tests/unit/build-output.test.ts（pnpm buildの後に実行する）
test('日本語ページがprerenderされている', () => {
  const html = readFileSync('dist/client/index.html', 'utf8');
  expect(html).toContain('<html lang="ja"');
  expect(html).toContain('Ryota Ikezawa</h1>');
});
test('英語ページが/en/index.htmlにprerenderされている', () => {
  const html = readFileSync('dist/client/en/index.html', 'utf8');
  expect(html).toContain('<html lang="en"');
  expect(html).toContain('Ryota Ikezawa</h1>');
});
test('404ページが出力されている', () => {
  expect(existsSync('dist/client/404.html')).toBe(true);
});
```

- [ ] **Step 3: 失敗を確認する** Run: `pnpm vitest run tests/unit/build-output.test.ts` Expected: FAIL（ENOENT）
- [ ] **Step 4: `scripts/prerender.ts`を実装する** `dist/client/index.html`をテンプレートとして読み、`dist/server/entry-server.js`の`render`を`ja`と`en`で呼んでプレースホルダを置換し、`dist/client/index.html`と`dist/client/en/index.html`に書き出す。`entry-client.tsx`は`document.documentElement.lang`からlocaleを決めて`hydrateRoot`する
- [ ] **Step 5: 通ることを確認する** Run: `pnpm build && pnpm vitest run tests/unit/build-output.test.ts` Expected: 3 passed。あわせて`pnpm lint && pnpm typecheck && pnpm fmt:check`がエラーなし
- [ ] **Step 6: コミット** `git commit -m "chore: Vite + Reactのprerender土台を作る"`

### Task 2: データと文面

**Files:**
- Create: `src/data/profile.ja.yml`, `src/data/profile.en.yml`, `src/data/types.ts`, `src/data/site.ts`, `src/data/index.ts`, `public/profile.jpg`
- Modify: `vite.config.ts`（`@rollup/plugin-yaml`を追加）
- Test: `tests/unit/copy.test.ts`, `tests/unit/content.test.ts`

**Interfaces:**
- Consumes: `Locale`（Task 1）
- Produces:
  - `src/data/types.ts`: `PortfolioData`, `WorkExperience`, `RoleEntry`, `Project`, `Star`, `Link`。funailogの`src/schemas/portfolio-collection.ts`の各zodスキーマと同じフィールドを、zodを使わないTypeScript型で書く
  - `src/data/site.ts`: `type TraceLabel = { label: string; sub: string }`、`type SiteCopy = { pitch: [string, string]; title: string; offers: { title: string; body: string }[]; traceHint: string; traceLabels: Record<string, TraceLabel>; writing: { year: number; date: string; title: string; media: string; url: string }[]; moreWritingLabel: string; footerEducation: string; footerBuiltWith: string; sourceUrl: string; ui: Record<'emailCta' | 'offersHeading' | 'present' | 'switchLanguage', string> }`、`siteCopy: Record<Locale, SiteCopy>`、`contacts: { email: 'pavegy@gmail.com'; github: 'https://github.com/paveg'; x: 'https://x.com/paveg_'; linkedin: 'https://www.linkedin.com/in/xpav' }`
  - `traceLabels`のキーは、会社なら`company`の値、役割なら`project`の値（例: `'freee顧問先管理'`）
  - `src/data/index.ts`: `getContent(locale: Locale): { profile: PortfolioData; copy: SiteCopy }`。`projects`からAttainを除いて返す

- [ ] **Step 1: データをコピーする** funailogの`src/content/portfolio/profile.yml`を`profile.ja.yml`に、`profile-en.yml`を`profile.en.yml`にコピーする。jaの「PjM」を「プロジェクトマネージャー」に置き換える。それ以外の文面とデータの形は変えない。`public/profile.jpg`はfunailogの`public/profile.jpg`を192×192に縮小して置く（`sips -Z 192`）
- [ ] **Step 2: `site.ts`に文面を書く** jaの値はモック`mockup.html`の文面をそのまま使う（価値提案、頼めること3項目、トレースの行ラベル10行、Writingの1件、フッター）。enは叩き台として書き、承認待ちとして扱う
- [ ] **Step 3: 失敗するテストを書く**

```ts
// tests/unit/copy.test.ts
const JA_ALNUM_SPACE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー、。] [A-Za-z0-9]|[A-Za-z0-9] [\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}、。]/u;
// collectStrings(value): オブジェクトを再帰的にたどって全文字列を返すテスト内ヘルパー
test('日本語の文面に、半角英数字の前後の空白がない', () => {
  const strings = [...collectStrings(getContent('ja').profile), ...collectStrings(siteCopy.ja)];
  expect(strings.filter((s) => JA_ALNUM_SPACE.test(s))).toEqual([]);
});
test('「PjM」が残っていない', () => {
  expect(collectStrings(getContent('ja')).filter((s) => s.includes('PjM'))).toEqual([]);
});
test('価値提案が承認済みの文言のまま', () => {
  expect(siteCopy.ja.pitch).toEqual(['プロダクトの設計から、それを動かす基盤まで。', '成長するSaaSを10年以上、作っては作り直してきました。']);
});

// tests/unit/content.test.ts
test('WorkにAttainが含まれない', () => {
  for (const locale of ['ja', 'en'] as const) expect(getContent(locale).profile.projects.map((p) => p.name)).not.toContain('Attain');
});
test('すべての役割と会社に行ラベルがある', () => {
  for (const locale of ['ja', 'en'] as const) {
    const { profile, copy } = getContent(locale);
    const keys = profile.workExperience.flatMap((w) => [w.company, ...(w.roles ?? []).map((r) => r.project!)]);
    expect(keys.filter((k) => !copy.traceLabels[k])).toEqual([]);
  }
});
```

- [ ] **Step 4: 失敗を確認する** Run: `pnpm vitest run tests/unit/copy.test.ts tests/unit/content.test.ts` Expected: FAIL
- [ ] **Step 5: `getContent`を実装し、テストが通るまで文面を直す**
- [ ] **Step 6: 通ることを確認する** Run: 同上 Expected: 5 passed
- [ ] **Step 7: コミット** `git commit -m "feat: 経歴データと日英の文面を追加する"`

### Task 3: トレースの計算（純関数）

**Files:**
- Create: `src/lib/trace.ts`
- Modify: `vite.config.ts`（`define: { __BUILD_MONTH__: JSON.stringify(<ビルド時のYYYY-MM>) }`）、`src/vite-env.d.ts`（`declare const __BUILD_MONTH__: string`）
- Test: `tests/unit/trace.test.ts`

**Interfaces:**
- Consumes: `PortfolioData`、`TraceLabel`（Task 2）
- Produces:
  - `AXIS = { start: 2015, end: 2027 }`
  - `toYearFraction(ym: string): number` — `YYYY-MM`以外は`Error('Invalid period: <値>')`を投げる
  - `positionPercent(ym: string): number` — AXIS上の0〜100
  - `type TraceRow = { key: string; kind: 'parent' | 'child' | 'other'; label: string; sub: string; start: string; end: string | null; left: number; width: number; isOpen: boolean; role: string; description: string; technologies: string[]; links: Link[]; star: Star[] }`
  - `buildTraceRows(data: PortfolioData, labels: Record<string, TraceLabel>, now: string): TraceRow[]` — 並びはfreee（parent）、その`roles`（child、開始の古い順）、それ以外の会社（other、データの順）。`end: null`の行は`isOpen: true`で、`now`までの幅にする
  - `formatPeriod(start: string, end: string | null, presentLabel: string): string` — `'2019.07 – 2022.06'`、`'2026.06 – 現在'`
  - `axisTicks(step: number): number[]` — `axisTicks(2)`は`[2015, 2017, 2019, 2021, 2023, 2025]`

- [ ] **Step 1: 失敗するテストを書く**

```ts
test('位置は軸の範囲に対する割合', () => {
  expect(positionPercent('2015-01')).toBe(0);
  expect(positionPercent('2021-01')).toBe(50);
});
test('書式違反の期間はエラーにする', () => {
  expect(() => toYearFraction('2019/07')).toThrow('Invalid period: 2019/07');
});
test('行の並びと種類', () => {
  const rows = buildTraceRows(getContent('ja').profile, siteCopy.ja.traceLabels, '2026-11');
  expect(rows.map((r) => r.kind)).toEqual(['parent', 'child', 'child', 'child', 'child', 'child', 'child', 'child', 'other', 'other']);
  expect(rows[1].label).toBe('Software Engineer');
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
```

- [ ] **Step 2: 失敗を確認する** Run: `pnpm vitest run tests/unit/trace.test.ts` Expected: FAIL
- [ ] **Step 3: `src/lib/trace.ts`を実装する**。`now`は呼び出し側が`__BUILD_MONTH__`を渡す。関数の中で`new Date()`を呼ばない
- [ ] **Step 4: 通ることを確認する** Run: 同上 Expected: 6 passed
- [ ] **Step 5: コミット** `git commit -m "feat: トレースの位置計算を追加する"`

### Task 4: 画面の静的な描画とスタイル

**Files:**
- Create: `src/components/{Hero,Trace,Offers,Work,Writing,Contact,Footer,IconSprite}.tsx`, `src/styles.css`
- Modify: `src/App.tsx`, `src/entry-client.tsx`（`import './styles.css'`）
- Test: `tests/unit/render.test.tsx`

**Interfaces:**
- Consumes: `getContent`（Task 2）、`buildTraceRows`・`formatPeriod`・`axisTicks`（Task 3）
- Produces: `App({ locale }: { locale: Locale })`。トレースの各行は`<details class="trace-row {kind}">`、バーは`<span class="bar" style="left:..%;width:..%">`、開いたスパンの終端は`<span class="open-end">`。Task 6はこのclass名を使う

レイアウト・余白・モバイルでの崩し方はモック`mockup.html`に合わせる。設計書「ビジュアル方針」の箇条（キャレット、ガイド線、期間の文字表示、2段ラベル、アイコンを名前の左、Writingは年を左に置いた1列のリストなど）をすべて満たす。

- [ ] **Step 1: 失敗するテストを書く**

```tsx
const ja = renderToString(<App locale="ja" />);
const en = renderToString(<App locale="en" />);
test('節が設計どおりの順に並ぶ', () => {
  const order = ['class="hero"', 'class="trace"', 'id="offers"', 'id="work"', 'id="writing"', 'id="contact"', '<footer'];
  const positions = order.map((marker) => ja.indexOf(marker));
  expect(positions.every((p) => p >= 0)).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
});
test('トレースは10行の<details>で、期間を文字でも出す', () => {
  expect(ja.match(/<details class="trace-row/g)).toHaveLength(10);
  expect(ja).toContain('2019.07 – 2022.06');
});
test('価値提案と連絡先', () => {
  expect(ja).toContain('成長するSaaSを10年以上、');
  expect(ja).toContain('href="mailto:pavegy@gmail.com"');
  expect(ja).toContain('href="https://www.linkedin.com/in/xpav"');
});
test('Writingの記事と、funailogへの案内', () => {
  expect(ja).toContain('グローバルチーム開発での経験とその取り組み');
  expect(ja).toContain('funailogで記事をもっと読む');
});
test('アイコンは名前より前にあり、alt=""', () => {
  expect(ja.indexOf('class="avatar"')).toBeLessThan(ja.indexOf('class="name"'));
  expect(ja).toMatch(/<img[^>]*class="avatar"[^>]*alt=""/);
});
test('隠す指定をHTMLに書かない', () => {
  expect(ja).not.toMatch(/opacity:\s*0|visibility:\s*hidden/);
});
test('英語版は英語の価値提案を出す', () => {
  expect(en).toContain('From product design to the platform it runs on.');
});
```

- [ ] **Step 2: 失敗を確認する** Run: `pnpm vitest run tests/unit/render.test.tsx` Expected: FAIL
- [ ] **Step 3: コンポーネントとCSSを実装する**。色はGlobal Constraintsのトークンをそのまま`:root`と`@media (prefers-color-scheme: dark)`に書く。モバイルのタップ領域は44px以上、本文以外の文字も13px以上にする
- [ ] **Step 4: 通ることを確認する** Run: 同上 Expected: 7 passed
- [ ] **Step 5: 見た目を確認する** Run: `pnpm build && pnpm preview`で、1280px幅と390px幅をモックと並べて見比べる（手動）
- [ ] **Step 6: コミット** `git commit -m "feat: ページの各節を描画する"`

### Task 5: headと言語切替

**Files:**
- Create: `src/head.ts`
- Modify: `src/entry-server.tsx`（`render`が`buildHead`の結果を`head`として返す）, `src/components/Hero.tsx`（言語切替リンク）
- Test: `tests/unit/head.test.ts`

**Interfaces:**
- Consumes: `Locale`、`siteCopy`
- Produces: `SITE_URL = 'https://me.funailog.com'`、`pagePath(locale: Locale): '/' | '/en/'`、`buildHead(locale: Locale): string`

- [ ] **Step 1: 失敗するテストを書く**

```ts
test('hreflangはja・en・x-defaultの3つ', () => {
  const head = buildHead('ja');
  expect(head).toContain('<link rel="alternate" hreflang="ja" href="https://me.funailog.com/">');
  expect(head).toContain('<link rel="alternate" hreflang="en" href="https://me.funailog.com/en/">');
  expect(head).toContain('<link rel="alternate" hreflang="x-default" href="https://me.funailog.com/">');
});
test('canonicalとOGPはページごとに出し分ける', () => {
  const head = buildHead('en');
  expect(head).toContain('<link rel="canonical" href="https://me.funailog.com/en/">');
  expect(head).toContain('<meta property="og:locale" content="en_US">');
  expect(head).toContain('<meta property="og:url" content="https://me.funailog.com/en/">');
});
test('言語切替は末尾スラッシュ付きのパスを指す', () => {
  expect(renderToString(<App locale="ja" />)).toContain('href="/en/"');
  expect(renderToString(<App locale="en" />)).toContain('href="/"');
});
```

- [ ] **Step 2: 失敗を確認する** Run: `pnpm vitest run tests/unit/head.test.ts` Expected: FAIL
- [ ] **Step 3: `buildHead`を実装する**。`<title>`は`Ryota Ikezawa — <肩書き>`、descriptionは価値提案の2文をつなげたもの、`og:type`は`profile`、`twitter:card`は`summary`。OGP画像はv1では入れない
- [ ] **Step 4: 通ることを確認する** Run: 同上 Expected: 3 passed
- [ ] **Step 5: コミット** `git commit -m "feat: 言語別のheadと言語切替を追加する"`

### Task 6: アニメーション

**Files:**
- Create: `src/hooks/useTraceAnimation.ts`, `playwright.config.ts`
- Modify: `src/components/Trace.tsx`
- Test: `tests/e2e/site.spec.ts`

**Interfaces:**
- Consumes: Task 4のclass名（`.trace-row`、`.bar`、`.open-end`、`.tick`、`.detail`）
- Produces: `useTraceAnimation(root: RefObject<HTMLElement | null>): void`
- `playwright.config.ts`: `webServer`で`pnpm build && pnpm exec wrangler dev --port 8787`を起動し、`baseURL: 'http://localhost:8787'`

動きの内容はモック`mockup.html`のスクリプトと同じにする（目盛り → 開始年順にバーが`scaleX`で伸びる → 現職の終端に一度だけopen色が灯る、`<details>`を開くと高さと透明度が動く）。`createScope({ root, mediaQueries: { reduceMotion: '(prefers-reduced-motion)' } })`を`useEffect`内で作り、後始末で`revert()`を呼ぶ。reduce時は何もしない。

- [ ] **Step 1: 失敗するテストを書く**

```ts
test('JS無効でも全節の本文とバーが見える', async ({ browser }) => {
  const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  await page.goto('/');
  for (const text of ['Ryota Ikezawa', '頼めること', 'Work', 'Writing & Talks', 'Contact']) await expect(page.getByText(text).first()).toBeVisible();
  await expect(page.locator('.bar').first()).toBeVisible();
});
test('reduced-motionではバーが最初から最終状態', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await page.goto('/');
  const transforms = await page.locator('.bar').evaluateAll((els) => els.map((el) => getComputedStyle(el).transform));
  expect(transforms.every((t) => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
});
test('アニメーション後、バーは最終状態に落ち着く', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const transforms = await page.locator('.bar').evaluateAll((els) => els.map((el) => getComputedStyle(el).transform));
  expect(transforms.every((t) => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
});
test('ハイドレーションのエラーが出ない', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/'); await page.goto('/en/');
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: hookを入れる前の状態を確認する** Run: `pnpm exec playwright install chromium && pnpm test:e2e` Expected: 4 passed。これらは「アニメーションを足しても静的HTMLの性質を壊さない」ことを固定する回帰テストなので、hookが無い状態で通るのが正しい
- [ ] **Step 3: `useTraceAnimation`を実装し、`Trace`から呼ぶ**
- [ ] **Step 4: 通ることを確認する** Run: `pnpm test:e2e` Expected: 4 passed
- [ ] **Step 5: コミット** `git commit -m "feat: トレースの描画と開閉のアニメーションを追加する"`

### Task 7: 品質ゲート（a11y・タップ領域・コントラスト・Lighthouse）

**Files:**
- Create: `tests/unit/contrast.test.ts`, `scripts/lighthouse.ts`
- Modify: `tests/e2e/site.spec.ts`, `package.json`（`"lighthouse": "tsx scripts/lighthouse.ts"`）
- Test: 同上

**Interfaces:**
- Consumes: `src/styles.css`のトークン、Task 6のPlaywright設定

- [ ] **Step 1: 失敗するテストを書く**

```ts
// tests/unit/contrast.test.ts — styles.cssから:rootとダークのトークンを読み、WCAGの式で比を計算する
test.each(['light', 'dark'])('%s: 本文は4.5:1以上、意味を持つ図形は3:1以上', (theme) => {
  const t = readTokens(theme);
  expect(contrast(t.ink, t.paper)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(t.muted, t.paper)).toBeGreaterThanOrEqual(4.5);
  for (const key of ['span', 'span-soft', 'open']) expect(contrast(t[key], t.paper)).toBeGreaterThanOrEqual(3);
});
```

```ts
// tests/e2e/site.spec.tsに追加
for (const path of ['/', '/en/']) {
  test(`${path}: axeの違反がゼロ`, async ({ page }) => {
    await page.goto(path);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}
test('モバイルでリンクとボタンのタップ領域が44px以上、文字は13px以上', async ({ browser }) => {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto('/');
  const small = await page.locator('a, button, summary').evaluateAll((els) => els.filter((el) => el.getBoundingClientRect().height < 44).map((el) => el.textContent));
  expect(small).toEqual([]);
  const tinyText = await page.locator('body *').evaluateAll((els) => els.filter((el) => el.childNodes[0]?.nodeType === 3 && parseFloat(getComputedStyle(el).fontSize) < 13).map((el) => el.textContent));
  expect(tinyText).toEqual([]);
});
test('トレースの行はキーボードで開閉でき、フォーカスが見える', async ({ page }) => {
  await page.goto('/');
  const summary = page.locator('.trace-row summary').first();
  await summary.focus();
  expect(await summary.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.locator('.trace-row').first()).toHaveAttribute('open', '');
});
test('横スクロールが出ない', async ({ browser }) => {
  const page = await (await browser.newContext({ viewport: { width: 360, height: 800 } })).newPage();
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
```

- [ ] **Step 2: 失敗を確認する** Run: `pnpm vitest run tests/unit/contrast.test.ts && pnpm test:e2e` Expected: 失敗があればCSSを直す（最初から通っても構わない）
- [ ] **Step 3: `scripts/lighthouse.ts`を実装する** `wrangler dev`で配信中の`/`と`/en/`にLighthouse（mobile設定）を実行し、PerformanceとAccessibilityのスコアを表示する。どちらかが95未満ならexit code 1
- [ ] **Step 4: 全部通ることを確認する** Run: `pnpm lint && pnpm typecheck && pnpm fmt:check && pnpm test && pnpm test:e2e && pnpm lighthouse` Expected: すべてexit 0、Lighthouseは4つのスコアがいずれも95以上
- [ ] **Step 5: 印刷を確認する**（手動）ブラウザの印刷プレビューで、閉じた行の中身も出ていて装飾が消えていること
- [ ] **Step 6: コミット** `git commit -m "test: a11y・コントラスト・Lighthouseの品質ゲートを追加する"`

### Task 8: 公開

**Files:**
- Modify: `wrangler.json`（`"routes": [{ "pattern": "me.funailog.com", "custom_domain": true }]`）

- [ ] **Step 1: 文面の承認を取る** 「頼めること」、トレースの2段目、英語版の文面一式を本人に見せ、承認をもらう。直しがあれば`site.ts`を直して、Task 2と4のテストを再実行する
- [ ] **Step 2: `wrangler.json`に`routes`を足してコミットする** `git commit -m "chore: me.funailog.comのcustom domainを設定する"`
- [ ] **Step 3: デプロイ前に本人の確認を取る**（外部公開になるため、ここで必ず止まる）
- [ ] **Step 4: デプロイする** Run: `pnpm build && pnpm exec wrangler deploy` Expected: 出力に`me.funailog.com`が含まれる
- [ ] **Step 5: 公開を確認する**

Run: `curl -s -o /dev/null -w '%{http_code}\n' https://me.funailog.com/` Expected: `200`
Run: `curl -s https://me.funailog.com/en/ | grep -o '<html lang="en"'` Expected: `<html lang="en"`
Run: `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://me.funailog.com/en` Expected: `307 https://me.funailog.com/en/`

- [ ] **Step 6: 公開先でLighthouseを確認する** Run: `pnpm lighthouse -- --url https://me.funailog.com/` Expected: PerformanceとAccessibilityが95以上
