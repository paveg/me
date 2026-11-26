export const NotFound = () => (
  <main className="page not-found">
    <h1 className="name">404</h1>
    <div lang="ja">
      <p>ページが見つかりませんでした。URLが変わったか、削除された可能性があります。</p>
      <p>
        <a href="/">トップへ戻る</a>
      </p>
    </div>
    <div lang="en">
      <p>This page could not be found. The URL may have changed, or the page was removed.</p>
      <p>
        <a href="/en/">Back to the English top page</a>
      </p>
    </div>
  </main>
);
