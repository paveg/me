import { expect, test, type Page } from '@playwright/test';

// クライアントのモジュールはload後に動き、インラインのスタイルを同期的に書き込む
const CLIENT_MODULE_SETTLE_MS = 200;

test('JS無効でも全節の本文とバーが見える', async ({ browser }) => {
  const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  await page.goto('/');
  for (const text of ['Ryota Ikezawa', '頼めること', 'Work', 'Writing & Talks', 'Contact']) {
    await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
  }
  await expect(page.locator('.bar').first()).toBeVisible();
});

const isIdentity = (t: string) => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';

const readBarTransforms = (page: Page) =>
  page.locator('.bar').evaluateAll((els) => els.map((el) => getComputedStyle(el).transform));

const countAnimatedInlineStyles = (page: Page) =>
  page
    .locator('.bar, .tick, .open-end')
    .evaluateAll(
      (els) =>
        els.filter(
          (el) =>
            (el as HTMLElement).style.transform !== '' || (el as HTMLElement).style.opacity !== '',
        ).length,
    );

test('reduced-motionではバーが最初から最終状態', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await page.goto('/');
  expect((await readBarTransforms(page)).every(isIdentity)).toBe(true);

  await page.waitForTimeout(CLIENT_MODULE_SETTLE_MS);
  expect(await countAnimatedInlineStyles(page)).toBe(0);
});

test('reduced-motionでなければアニメーションが走る', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => countAnimatedInlineStyles(page), { timeout: 5000 }).toBeGreaterThan(0);
});

test('アニメーション後、バーは最終状態に落ち着く', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => countAnimatedInlineStyles(page), { timeout: 5000 }).toBeGreaterThan(0);
  await expect
    .poll(async () => (await readBarTransforms(page)).every(isIdentity), { timeout: 10_000 })
    .toBe(true);
});

test('コンソールにエラーが出ない', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await page.goto('/en/');
  expect(errors).toEqual([]);
});
