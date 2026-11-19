# me.funailog.comポートフォリオサイト設計

## 目的

funailog.comの`/portfolio`にある経歴を独立サイトとして切り出し、自分を売り込む。
読み手は三者いる。

- 副業の発注者: 何を頼めるかと連絡方法を数十秒で判断したい
- 採用担当: 経歴の流れ（IC → TL → EM → アーキテクト → SRE TL）と実績リンクを見る
- エンジニア: 作りの精度を見る。サイト自体が技術力の証明になる

見た目はミニマルにし、動きだけをanime.jsで磨く。

## ゴール / 非ゴール / アンチゴール

ゴール

- `/`（日本語）と`/en/`（英語）の2ページを、ビルド時に生成した静的HTMLで配信する
- 冒頭で「頼めること」と連絡導線を示し、経歴詳細は開閉式で必要な人だけが読めるようにする
- anime.jsによるトレースの描画を入れる。自動で動かすのはtransformとopacityに限る

非ゴール（v1では作らない）

- 問い合わせフォーム（後でWorkerとTurnstileを使って追加する。v1に足場は作らない）
- CVのPDF出力（印刷用CSSでブラウザ印刷に任せる）
- funailog側の削除・リダイレクト（当面は併存する）
- ブログ記事の転載やCMS

アンチゴール（動いても失敗とみなす）

- JSが無いと本文が読めない
- 動きのせいでLCPやCLSが悪化する、またはreduced-motionの設定を無視する
- 装飾過多で「何を頼めるか」が埋もれる

## 制約

- ホスティング: Cloudflare Workersのstatic assets（Workerコードなし）。ドメインは`me.funailog.com`（funailog.comゾーンのcustom domain）
- スタック: Vite + React 19 + anime.js v4（確認時点の最新は4.5.0）
- スタイル: 素のCSSとカスタムプロパティ。UIライブラリは入れない
- 言語とツール: コードはすべてTypeScriptで書く（ビルド用のスクリプトも含む）。lintはoxlint、フォーマットはoxfmt（どちらもoxc、本人の指定）。型検査は`tsc --noEmit`
- 経歴の正（source of truth）: 当面はfunailogと二重管理になる（既知の重複。下記「既知の課題」参照）
- careerリポジトリにある応募状況や年収などの情報は、サイトに一切載せない

### 文面の規則

- 日本語の文中では、半角英数字の前後に空白を入れない（例: 「成長するSaaSを10年以上」「API連携」）。英語の文はこの規則の対象外
- 「PjM」は「プロジェクトマネージャー」と書く。profile.ymlをコピーするときも置き換える（データの形は変えず、文面だけ直す）
- 「フルスタック」という語は使わない。幅の広さは両端の具体名で示す

## アプローチ

| 案 | 内容 | 判断 |
| --- | --- | --- |
| A. Vite + React + 自前prerender | ViteのSSRビルドで`renderToString`し、2枚のHTMLを書き出す。ブラウザではハイドレーションせず、アニメーションのモジュールだけを動かす | **採用**。依存が増えず、スクリプトは数十行で済む。2ページなら十分。操作は`<details>`がHTMLだけでこなすので、Reactのランタイムを送らずに済む（本人の決定） |
| B. SSGプラグイン（vite-react-ssg等） | 自前のコードは減る | React 19への追従に左右される依存が増えるため不採用 |
| C. React Router v7 framework mode + prerender | ルーティング・head管理が揃い、フォーム追加も自然 | 2ページには抽象が重く、ミニマルの方針と逆向きなので不採用 |
| 素のCSR SPA | — | 空のHTMLになり、JS無効時に読めず、言語別のheadも出せないため候補外 |
| Astro + React | funailogと同じで最安 | ユーザーがVite + Reactを指定しているため見送り |

## 決まった設計

### ページ構成（日英共通）

```
[Hero]            アイコン + 名前 / 肩書き / 価値提案 / メールボタン + SNS / 言語切替
[Career]          トレース（役割の変遷。詳細は<details>で開閉）
[頼めること]       3項目
[Work]            OSS / 個人プロダクト
[Writing & Talks] 寄稿・登壇・選んだ記事
[Contact]         メール・GitHub・X・LinkedIn
[Footer]          学歴1行 / 「Claude Codeで設計・実装」+ ソースへのリンク
```

- 言語切替は`/`と`/en/`の間の通常のリンクにする
- 各ページの`<html lang>`、`<title>`、description、OGP、hreflang（ja / en / x-default）をページごとに出し分ける

### ビジュアル方針

コンセプト: **キャリアを1本の分散トレースとして描く**。
SREが日常的に見るAPMのウォーターフォール表示を借り、freeeを親スパン、各役割を子スパン、現職を「まだ閉じていないスパン」として横軸2015 → 現在に並べる。
これがページで唯一の大胆な要素であり、Heroの主役を兼ねる。周囲は静かに保つ。

ワイヤーフレーム（デスクトップ）

```
(icon) Ryota Ikezawa                                   日本語 | English
SRE / Platform Engineer / Tech Lead
プロダクトの設計から、それを動かす基盤まで。
成長するSaaSを10年以上、作っては作り直してきました。
[✉ メールで相談する]   GitHub   X   LinkedIn

各行を開くと、役割の詳細と使った技術が見られます。
                          2015     2017     2019     2021     2023     2025
› freee                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
  クラウド会計・人事労務SaaS
│ › Software Engineer      ━━━━━━━━━━━
│   銀行・カード会社とのAPI連携
│ › Tech Lead                         ━━━━━━━━━
│   融資サービスの立ち上げ
│   …（Tech Lead / EM / Tech Lead ×2 / Architect）
│ › SRE / Tech Lead                                                    ━●
│   開発基盤とプラットフォーム
› ACALL                             ━━
› エクストップテクノロジー  ━

頼めること（罫線なしのリスト、3項目）
Work（OSS / 個人プロダクトのリスト。列の幅を18rem以上にして入るだけ並べる（1280pxの幅で3列、モバイルで1列）。カードにしない）
Writing & Talks（寄稿・登壇・選んだブログ記事。年を左に置いた1列のリスト）
Contact
```

- 行ラベルに社内のチーム名・プロジェクト名は使わない（初めての訪問者には意味が通じないため）。1段目に役割（Software Engineer / Tech Lead / EM / Architect / SRE）、2段目に何をしたかを平易な言葉で書く。例: `EM / Tech Lead`＋「税理士向けサービスの作り直し」。この2段目は新しい文面なので、日英とも本人の承認を取る
- 行が開閉できることを見せる: ラベル左のキャレット（開くと90°回転）、行ホバー時の薄い背景、トレース上の1行の案内文
- 会社と役割の階層を、デスクトップでもモバイルでも見分けられるようにする。会社の行は太字にし、配下の役割の行は字下げして縦のガイド線でつなぐ。役割の行どうしの区切り線は省き、会社ごとのまとまりとして見せる。バーの位置は全行で揃えたまま、字下げはラベル側だけに入れる
- 社名・役割の行は折り返さない。2段目の説明だけ折り返しを許す
- デスクトップでも、役割名の横に期間（例: 2019.07 – 2022.06）を文字で出す。バーの位置だけに時期の情報を持たせない
- 日本語の見出しや価値提案は、文節単位の`inline-block`で区切り、語の途中で改行させない
- 名前の左に、funailogと同じプロフィールアイコン（`profile.jpg`）を丸く切り抜いて置く。大きさは名前の文字の高さに合わせる（デスクトップで約5rem、モバイルで約3rem）。名前の横にある飾りとして扱い、`alt=""`にする。LCP要素は名前のままにするため、画像は表示サイズの2倍程度に縮めて配信する
- 連絡先にはアイコンを付ける（メール、GitHub、X、LinkedIn）。インラインSVGのスプライトにし、外部へのリクエストを増やさない
- WorkにはAttainを載せない（10件）
- スキルは独立した節にせず、各行を開いたときの技術タグとして出す。学歴は末尾に1行（承認済み）
- Writing & Talksは手で選んだ項目をYAMLに持つ（RSS全件の自動取り込みはしない）。各項目はタイトル・媒体名・年・リンク。表示は、左に年、右にタイトル（リンク）とその下に媒体名を置く1列のリストにし、Workの格子は流用しない（長いタイトルが狭い列で折れるため）。社外の媒体を上に並べる。funailogへの案内はリストの項目にせず、リストの下に「funailogで記事をもっと読む」というリンクとして置く。現時点で確定している項目は「グローバルチーム開発での経験とその取り組み」（freee Developers Hub、2023-12-11、https://developers.freee.co.jp/entry/global-team-development-efforts）の1件。ほかの寄稿・登壇は本人が見つけ次第追加する
- スパンの行は`<details>`で、開くとその役割の説明・STAR・リンクを表示する。スパン全体がキャリア節を兼ねるので、別のタイムラインは作らない
- モバイルでは役割名をバーの上に置き、横軸は画面幅に合わせて縮める（横スクロールは出さない）。役割名の右に期間を文字で出す。年の目盛りは4年刻みに間引く。メールのボタンは全幅にし、SNSリンクはその下に1行で並べる
- 本文は左揃え、1行80字以内。Heroとトレースだけを全幅に広げる

色（ライト）

| 名前 | 値 | 用途 |
| --- | --- | --- |
| paper | `#FBFCFD` | 背景 |
| ink | `#1C2733` | 本文・名前 |
| muted | `#5B6B7C` | 補足・年の目盛り |
| rule | `#DCE2E9` | 目盛り線・区切り |
| span | `#2E6BD6` | スパンのバー・リンク |
| span-soft | `#7090C2` | freee以外の会社のバー（背景比3.17:1） |
| open | `#B07200` | 現職（閉じていないスパン）の終端のみ（背景比3.89:1） |

ダークモードは同じ役割の色を`prefers-color-scheme: dark`で入れ替える（背景は深い紺`#14212F`、ink `#E6ECF2`、muted `#9AABBD`、rule `#2A3B4F`、span `#6FA0F2`、span-soft `#5A7AAE`、open `#F2B544`）。コントラストは本文4.5:1以上、意味を持つ図形は3:1以上を守る。

文字

- LINE Seed JP（日英とも1ファミリー、本人の指定）。和文と英数字が揃うように作られている。SIL OFL 1.1で、予約フォント名の指定はない（google/fontsの`ofl/lineseedjp/OFL.txt`で確認）
- 使う太さは2つ。名前、見出し、会社名、ボタンは700、ほかは400。名前は大きく、字間を詰めて「組んだ文字」として見せる
- 数字はプロポーショナルのまま使う。この書体には`tnum`がない（GSUBの機能一覧で確認）。年の目盛りは位置を割合で決めて置き、期間の表記は右揃えにするので、桁がずれても読みにくくならない。数字だけ別の書体にしたり、全角数字にしたりはしない
- 全大文字のラベル、見出し上の小さな見出し、中黒で連結したメタ情報、矢印付きリンクは使わない
- 年の目盛りやスパンの期間を等幅フォントで書かない

フォントの配り方

- ビルドのときに、`/`と`/en/`で使う文字だけを含むwoff2を太さごとに作り、同じドメインから配る。外部のフォント配信（Google Fontsなど）には接続しない
- 元のTTF（RegularとBold）と`OFL.txt`をリポジトリに入れる。ビルドのたびにネットワークから取らない
- 画面に表示される文字（`<body>`の本文と`<title>`）に、フォントにない文字が1つでもあれば、ビルドを失敗させる（文面を変えたときに、一部だけ別の書体で出る事故を防ぐ）
- 2つのwoff2を`<link rel="preload">`で先に読み込み、`font-display: optional`にする。読み込みが間に合わなければ、そのページは代わりの書体のまま表示し、途中で書体を差し替えない。名前の位置がずれず、CLSが出ない

動き

- 自動で動くのはページ読み込み時の一度だけ。目盛り線が引かれ、各スパンが開始年の順に`scaleX`で左から伸び、最後に現職の終端に一度だけopen色が灯る
- 名前と価値提案は最初から静止表示する（LCPを守る）
- 操作への応答として、`<details>`の開閉で高さと中身の透明度を動かす（「transformとopacityに限る」は自動で動く部分だけに適用する。ユーザー操作の直後に起きるレイアウト変化はCLSに数えられない）
- reduced-motionのときはすべて最終状態で表示する

### データ

- funailogの`src/content/portfolio/profile.yml`と`profile-en.yml`を、形を変えずに`src/data/`へコピーする（文面は「文面の規則」に合わせて直す）
- ビルド時にYAMLを読み込む。型はfunailogの`src/schemas/portfolio-collection.ts`から、zod抜きのTypeScript型として移植する（実行時の検証は省く。他人がデータを編集するようになったら足す）
- 価値提案（承認済み）: 「プロダクトの設計から、それを動かす基盤まで。成長するSaaSを10年以上、作っては作り直してきました。」／ "From product design to the platform it runs on. Over a decade of building, and rebuilding, a growing SaaS."
- 「頼めること」は (1) Kubernetes / EKS基盤とCI/CDの改善、(2) レガシーのリモデリングとAPI設計、(3) Webアプリケーションの立ち上げ（Claude Codeを中心にした開発）の3つ
- フッターに「このサイトはClaude Codeで設計・実装しました」とリポジトリ（`https://github.com/paveg/me`、公開。gh-infraのマニフェストで作成）へのリンクを置く。Workの各プロダクトには、AIの使用有無を書かない（本人が確認していないため）
- 「頼めること」の文面とUI文言は新規データとして持つ。日英それぞれ用意する。**文面は本人の主張になるので、builderの叩き台を本人が承認してから載せる**
- `profile.jpg`をfunailogの`public/`からコピーする
- 英語版のトレースの2段目は、プロフィールREADME（paveg/paveg）の経歴SVG用に書いた文言を叩き台にする。会社名は英語の正式表記（freee K.K.、ACALL Inc.、Xtop Technology K.K.）にする。叩き台なので、ほかの文面と同じく公開前に本人の承認を取る
  - freee K.K.: Cloud accounting and HR SaaS
  - Software Engineer: Bank and card API integrations
  - Tech Lead: Launching a lending service
  - Tech Lead: Paper receipts to journal entries
  - EM / Tech Lead: Rebuilding a tax accountant service
  - EM / Tech Lead: Launching an employee app
  - Architect: Splitting the HR platform
  - SRE / Tech Lead: Developer platform
  - ACALL Inc.: Rails upgrade (contract)
  - Xtop Technology K.K.: Systems integrator, on-prem to AWS

### アニメーション（anime.js v4）

- アニメーションは、prerender済みのDOMに対して動く素のTypeScriptのモジュールとして書く（Reactのコンポーネントやフックにしない）。`createScope({ root, mediaQueries: { reduceMotion: '(prefers-reduced-motion)' } })`を作り、後始末のために`revert()`を呼ぶ関数を返す
- ブラウザに送るJSは、このモジュールとanime.jsだけにする。Reactはビルドのときにだけ使う
- 出現アニメのために要素を最初に隠す処理はJS側で、しかもreduced-motionでないときだけ行う。CSSやprerender済みHTMLには隠す指定を書かない
- Heroの名前（LCP要素）は最初から表示する
- 動かす対象は「動き」の節に書いたものだけにする（読み込み時のトレース描画と、`<details>`の開閉）。セクションごとのスクロール連動の出現は入れない
- reduced-motionのときはアニメーションを再生せず、最終状態で静止させる

### 連絡先

- メール: `pavegy@gmail.com`
- GitHub: `https://github.com/paveg`
- X: `https://x.com/paveg_`
- LinkedIn: `https://www.linkedin.com/in/xpav`

### 配信

- `wrangler.json`は`assets.directory`を`./dist`にし、`not_found_handling`は`404-page`にする（404.htmlを用意する）
- 既定の`html_handling: auto-trailing-slash`により、`/en`は`/en/`へ307で転送され、`dist/en/index.html`が配信される
- v1の完了は`me.funailog.com`での公開まで（本人の決定）。`wrangler.json`の`routes`に`{ "pattern": "me.funailog.com", "custom_domain": true }`を書き、最初はローカルから手動で`wrangler deploy`する。CIでの自動デプロイはv1に含めない
- デプロイは外部に公開する操作なので、実行の直前に本人の確認を取る
- 印刷用CSS（`@media print`）で装飾を消す。閉じた`<details>`も印刷時は中身を出す（`::details-content`か`beforeprint`での展開か、手段はbuilderに任せる）
- 文面（価値提案、頼めること、UI文言）はbuilderが叩き台を書いてビルドを通し、本人の承認を公開の前提条件にする（builderの判断）

## 完了条件

| 条件 | 確認方法 |
| --- | --- |
| oxlintと`tsc --noEmit`がエラーなしで通る | 自動 |
| 日本語の文面（YAMLとUI文言）で、半角英数字の前後に空白がない。「PjM」が残っていない | 自動（文面を走査するテスト） |
| `/`と`/en/`のLighthouse Performance・Accessibilityがともに95以上 | 自動（Lighthouse CLIをローカルのプレビューに実行） |
| `dist/client`のJS、CSS、フォント、画像の大きさが、それぞれの上限以下。ブラウザに送るJSにReactが含まれない | 自動（ビルド結果を測るテスト。上限は、フォントを入れた時点（計画のTask 7）の実測に2割の余裕を足して決める） |
| 画面に表示される文字（`<body>`の本文と`<title>`）がすべて、配るフォントに含まれる | 自動（ビルドが失敗する）。`alt`や`aria-label`、`<meta>`の文字は画面のフォントで描かれないので対象外 |
| JS無効で全セクションの本文が読める | 自動（PlaywrightでJSを無効にしてテキストの存在を確認） |
| reduced-motion時に要素が最終状態で表示されている | 自動（Playwrightの`reducedMotion: 'reduce'`） |
| axeの違反がゼロ | 自動（Playwright + axe-core） |
| 各ページの`lang`・hreflang・OGPが正しい | 自動（生成HTMLの検査） |
| 意味を持つ図形（薄いバー、現職マーカー）と背景のコントラストが3:1以上（WCAG 1.4.11） | 自動（色トークンからの計算） |
| モバイルのリンク・ボタンのタップ領域が44px以上、本文以外の文字も13px以上 | 自動（Playwrightで要素の寸法を取得） |
| `https://me.funailog.com/`と`https://me.funailog.com/en/`が200を返し、それぞれの`lang`がja / en | 自動（デプロイ後にcurl） |
| 動きの印象、印刷時の見た目 | 手動 |

## 既知の課題

- 経歴データがfunailogと二重管理になる。funailogの`/portfolio`を新サイトへ301し、関連コード（profile.yml、cv-generator、portfolioコンポーネント、i18nキー）を削除するのは別の作業として後で決める

## builderに任せること

- コンポーネント分割、ファイル構成、prerenderスクリプトの詳細
- anime.jsの具体的なイージングと時間
- 余白や文字サイズの細かい値（色・書体・レイアウトの方針は上で決めたとおり）

## v1の後に回すこと

- 遊び用のアニメーションページ`/play`（`/en/play`）。本体からはフッターのリンク1本でつなぐ。題材はKarpenterのビンパッキングに決定（本人承認済み）。Podの配置、ノードの起動、統合（対象に斜線 → Podが浮く → 弧を描いて移動 → ノードが潰れて残りが詰める）、イベントログ、統計のカウントアップを、モック`play.html`の挙動どおりに作る
- 問い合わせフォーム、funailog側の整理、CIでの自動デプロイ

## 参考

- UIのモックアップ（使い捨て）: `docs/superpowers/specs/mockups/`の`mockup.html`と`play.html`。ブラウザで直接開ける。本番の実装はモックのコードを流用せず、この設計書から作る
