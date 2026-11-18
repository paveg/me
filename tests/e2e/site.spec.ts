import { expect, test } from '@playwright/test';

test('JS無効でも全節の本文とバーが見える', async ({ browser }) => {
  const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  await page.goto('/');
  for (const text of ['Ryota Ikezawa', '頼めること', 'Work', 'Writing & Talks', 'Contact']) {
    await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
  }
  await expect(page.locator('.bar').first()).toBeVisible();
});

test('reduced-motionではバーが最初から最終状態', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await page.goto('/');
  const transforms = await page
    .locator('.bar')
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).transform));
  expect(transforms.every((t) => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
});

test('アニメーション後、バーは最終状態に落ち着く', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const transforms = await page
    .locator('.bar')
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).transform));
  expect(transforms.every((t) => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
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
