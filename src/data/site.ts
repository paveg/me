import type { Locale } from '../entry-server';

export type TraceLabel = { label: string; sub: string };

export type SiteCopy = {
  pitch: [string, string];
  title: string;
  offers: { title: string; body: string }[];
  traceHint: string;
  traceLabels: Record<string, TraceLabel>;
  writing: { year: number; date: string; title: string; media: string; url: string }[];
  moreWritingLabel: string;
  footerEducation: string;
  footerBuiltWith: string;
  sourceUrl: string;
  ui: Record<
    'emailCta' | 'offersHeading' | 'present' | 'switchLanguage' | 'sourceCode' | 'traceHeading',
    string
  >;
};

export const contacts = {
  email: 'pavegy@gmail.com',
  github: 'https://github.com/paveg',
  x: 'https://x.com/paveg_',
  linkedin: 'https://www.linkedin.com/in/xpav',
} as const;

const sourceUrl = 'https://github.com/paveg/me';

export const siteCopy: Record<Locale, SiteCopy> = {
  ja: {
    pitch: [
      'プロダクトの設計から、それを動かす基盤まで。',
      '成長するSaaSを10年以上、作っては作り直してきました。',
    ],
    title: 'Site Reliability Engineer / Platform Engineer / Tech Lead',
    offers: [
      {
        title: 'Kubernetes / EKS基盤とCI/CDの改善',
        body: 'Karpenter・Istio・ArgoCDを使ったコンテナ基盤の運用と、デプロイの速さと安全性の改善。',
      },
      {
        title: 'レガシーのリモデリングとAPI設計',
        body: '長く続くサービスのデータモデル刷新、無停止マイグレーション、gRPC / OpenAPIでのサービス境界設計。',
      },
      {
        title: 'Webアプリケーションの立ち上げ',
        body: 'Claude Codeを開発の中心に据え、企画から公開までを短いサイクルで回します。Hono・React・Cloudflare Workersでの個人プロダクトを継続して立ち上げています。',
      },
    ],
    traceHint: '各行を開くと、役割の詳細と使った技術が見られます。',
    traceLabels: {
      freee株式会社: { label: 'freee', sub: 'クラウド会計・人事労務SaaS' },
      データ集約機能: { label: 'Software Engineer', sub: '銀行・カード会社とのAPI連携' },
      '資金調達freee / オファー型融資': { label: 'Tech Lead', sub: '融資サービスの立ち上げ' },
      freeeデータ化サービス: { label: 'Tech Lead', sub: '紙の証憑を仕訳データにする' },
      freee顧問先管理: { label: 'EM / Tech Lead', sub: '税理士向けサービスの作り直し' },
      従業員ポータル: { label: 'EM / Tech Lead', sub: '従業員向けアプリの立ち上げ' },
      人事労務統合基盤: { label: 'Architect', sub: '人事労務基盤のサービス分割' },
      'DXチーム（Developer Experience）': {
        label: 'SRE / Tech Lead',
        sub: '開発基盤とプラットフォーム',
      },
      ACALL株式会社: { label: 'ACALL', sub: '業務委託でRailsの更新' },
      エクストップテクノロジー株式会社: {
        label: 'エクストップテクノロジー',
        sub: 'オンプレからAWSへの移行',
      },
    },
    writing: [
      {
        year: 2023,
        date: '2023-12-11',
        title: 'グローバルチーム開発での経験とその取り組み',
        media: 'freee Developers Hub',
        url: 'https://developers.freee.co.jp/entry/global-team-development-efforts',
      },
    ],
    moreWritingLabel: 'funailogで記事をもっと読む',
    footerEducation: '専修大学 法学部 政治学科 卒業（2015）',
    footerBuiltWith: 'このサイトはClaude Codeで設計・実装しました。',
    sourceUrl,
    ui: {
      emailCta: 'メールで相談する',
      offersHeading: '頼めること',
      present: '現在',
      switchLanguage: 'English',
      sourceCode: 'ソースコード',
      traceHeading: '経歴',
    },
  },
  en: {
    pitch: [
      'From product design to the platform it runs on.',
      'Over a decade of building, and rebuilding, a growing SaaS.',
    ],
    title: 'Site Reliability Engineer / Platform Engineer / Tech Lead',
    offers: [
      {
        title: 'Kubernetes / EKS platform and CI/CD improvements',
        body: 'Running container platforms with Karpenter, Istio, and ArgoCD, and making deployments faster and safer.',
      },
      {
        title: 'Legacy remodeling and API design',
        body: 'Reworking the data model of long-lived services, zero-downtime migrations, and service boundary design with gRPC and OpenAPI.',
      },
      {
        title: 'Launching web applications',
        body: 'With Claude Code at the center of development, I take a product from idea to release in short cycles. I keep launching personal products on Hono, React, and Cloudflare Workers.',
      },
    ],
    traceHint: 'Open a row to see the role in detail and the technologies used.',
    traceLabels: {
      'freee K.K.': { label: 'freee', sub: 'Cloud accounting and HR/payroll SaaS' },
      'Data Aggregation Feature': {
        label: 'Software Engineer',
        sub: 'API integrations with banks and card companies',
      },
      'freee Financing / Offer-type Loan': {
        label: 'Tech Lead',
        sub: 'Launching a lending service',
      },
      'freee Data Entry Service': {
        label: 'Tech Lead',
        sub: 'Turning paper receipts into journal entries',
      },
      'freee Advisor Client Management': {
        label: 'EM / Tech Lead',
        sub: 'Rebuilding the service for tax accountants',
      },
      'Employee Portal': { label: 'EM / Tech Lead', sub: 'Launching an app for employees' },
      'HR/Payroll Integration Platform': {
        label: 'Architect',
        sub: 'Splitting the HR/payroll platform into services',
      },
      'DX Team (Developer Experience)': {
        label: 'SRE / Tech Lead',
        sub: 'Developer platform and infrastructure',
      },
      'ACALL Inc.': { label: 'ACALL', sub: 'Contract work upgrading Rails' },
      'Exetop Technology Inc.': {
        label: 'Exetop Technology',
        sub: 'Migrating from on-premises to AWS',
      },
    },
    writing: [
      {
        year: 2023,
        date: '2023-12-11',
        title: 'Experiences and efforts in global team development',
        media: 'freee Developers Hub',
        url: 'https://developers.freee.co.jp/entry/global-team-development-efforts',
      },
    ],
    moreWritingLabel: 'Read more articles on funailog',
    footerEducation: 'Bachelor of Law (Political Science), Senshu University (2015)',
    footerBuiltWith: 'This site was designed and built with Claude Code.',
    sourceUrl,
    ui: {
      emailCta: 'Get in touch by email',
      offersHeading: 'What I can help with',
      present: 'Present',
      switchLanguage: '日本語',
      sourceCode: 'Source code',
      traceHeading: 'Career',
    },
  },
};
