import AxeBuilder from '@axe-core/playwright';
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
  await expect(page.locator('.duration').first()).toBeVisible();
  await expect(page.locator('.open-end').first()).toBeVisible();
});

const isIdentity = (t: string) => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';

const readBarTransforms = (page: Page) =>
  page.locator('.bar').evaluateAll((els) => els.map((el) => getComputedStyle(el).transform));

const countAnimatedInlineStyles = (page: Page) =>
  page
    .locator('.bar, .open-end, .duration')
    .evaluateAll(
      (els) =>
        els.filter(
          (el) =>
            (el as HTMLElement).style.transform !== '' ||
            (el as HTMLElement).style.opacity !== '' ||
            (el as HTMLElement).style.transition !== '',
        ).length,
    );

const waitForAnimationToSettle = async (page: Page) => {
  await expect.poll(() => countAnimatedInlineStyles(page), { timeout: 5000 }).toBeGreaterThan(0);
  await expect.poll(() => countAnimatedInlineStyles(page), { timeout: 10_000 }).toBe(0);
};

test('reduced-motionではバーが最初から最終状態', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await page.goto('/');
  expect((await readBarTransforms(page)).every(isIdentity)).toBe(true);

  await page.waitForTimeout(CLIENT_MODULE_SETTLE_MS);
  expect(await countAnimatedInlineStyles(page)).toBe(0);
  await expect(page.locator('.playhead')).toHaveCount(0);
});

test('reduced-motionでなければアニメーションが走る', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => countAnimatedInlineStyles(page), { timeout: 5000 }).toBeGreaterThan(0);
  await expect(page.locator('.playhead')).toHaveCount(1);
});

test('アニメーション後、バーは最終状態に落ち着く', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => countAnimatedInlineStyles(page), { timeout: 5000 }).toBeGreaterThan(0);
  await expect
    .poll(async () => (await readBarTransforms(page)).every(isIdentity), { timeout: 10_000 })
    .toBe(true);
  await expect(page.locator('.playhead')).toHaveCount(0);
});

test('アニメーション後、フェードのインラインのスタイルも残らない', async ({ page }) => {
  await page.goto('/');
  await waitForAnimationToSettle(page);
  await expect(page.locator('.playhead')).toHaveCount(0);
});

test('再生中に行を開いても、最後は最終状態に落ち着く', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => countAnimatedInlineStyles(page)).toBeGreaterThan(0);
  await page.locator('.trace-row summary').first().click();
  await expect
    .poll(
      () =>
        page
          .locator('.bar')
          .evaluateAll((els) =>
            els.every((el) =>
              ['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(getComputedStyle(el).transform),
            ),
          ),
      { timeout: 10_000 },
    )
    .toBe(true);
  await expect(page.locator('.playhead')).toHaveCount(0);
  await expect(page.locator('.trace-row').first()).toHaveAttribute('open', '');
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

for (const path of ['/', '/en/']) {
  test(`${path}: axeの違反がゼロ`, async ({ page }) => {
    await page.goto(path);
    await waitForAnimationToSettle(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test('モバイルでリンクとボタンのタップ領域が44px以上、文字は13px以上', async ({ browser }) => {
  const page = await (
    await browser.newContext({ viewport: { width: 390, height: 844 } })
  ).newPage();
  await page.goto('/');
  const small = await page
    .locator('a, button, summary')
    .evaluateAll((els) =>
      els.filter((el) => el.getBoundingClientRect().height < 44).map((el) => el.textContent),
    );
  expect(small).toEqual([]);
  const tinyText = await page
    .locator('body *')
    .evaluateAll((els) =>
      els
        .filter(
          (el) =>
            el.childNodes[0]?.nodeType === 3 && parseFloat(getComputedStyle(el).fontSize) < 13,
        )
        .map((el) => el.textContent),
    );
  expect(tinyText).toEqual([]);
});

test('トレースの行はTabで届き、Enterで開きSpaceで閉じ、フォーカスが見える', async ({ page }) => {
  await page.goto('/');
  const summary = page.locator('.trace-row summary').first();
  const isFocused = () => summary.evaluate((el) => el === document.activeElement);
  for (let presses = 0; presses < 30 && !(await isFocused()); presses++) {
    await page.keyboard.press('Tab');
  }
  expect(await isFocused()).toBe(true);

  const outline = await summary.evaluate((el) => {
    const { outlineStyle, outlineWidth } = getComputedStyle(el);
    return { outlineStyle, outlineWidth };
  });
  expect(outline).toEqual({ outlineStyle: 'solid', outlineWidth: '2px' });

  const row = page.locator('.trace-row').first();
  await page.keyboard.press('Enter');
  await expect(row).toHaveAttribute('open', '');
  await expect.poll(() => row.locator('.detail').evaluate((el) => el.style.cssText)).toBe('');
  await page.keyboard.press('Space');
  await expect(row).not.toHaveAttribute('open');
});

test('ヒーローのリンクにフォーカスが当たると、本文色の線が出て、角の丸みは変わらない', async ({
  page,
}) => {
  await page.goto('/');
  const inkColor = await page.evaluate(() => getComputedStyle(document.body).color);
  const links = page.locator('.contact-row a');
  for (let index = 0; index < (await links.count()); index++) {
    const link = links.nth(index);
    const radiusBefore = await link.evaluate((el) => getComputedStyle(el).borderRadius);
    await link.focus();
    const focused = await link.evaluate((el) => {
      const { outlineStyle, outlineColor, borderRadius } = getComputedStyle(el);
      return {
        outlineStyle,
        outlineColor,
        borderRadius,
        isFocusVisible: el.matches(':focus-visible'),
      };
    });
    expect(focused).toEqual({
      outlineStyle: 'solid',
      outlineColor: inkColor,
      borderRadius: radiusBefore,
      isFocusVisible: true,
    });
  }
});

test('横スクロールが出ない', async ({ browser }) => {
  const page = await (
    await browser.newContext({ viewport: { width: 360, height: 800 } })
  ).newPage();
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
