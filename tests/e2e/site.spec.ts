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

test('JSの到着が遅れたら、表示済みの経歴を消して描き直さない', async ({ page }) => {
  await page.route('**/assets/*.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.goto('/');
  await page.waitForTimeout(CLIENT_MODULE_SETTLE_MS);
  for (let i = 0; i < 5; i++) {
    expect((await readBarTransforms(page)).every(isIdentity)).toBe(true);
    await page.waitForTimeout(100);
  }
  const row = page.locator('details.trace-row').first();
  await row.locator('summary').click();
  await expect(row).toHaveAttribute('open', '');
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

const listSmallTapTargets = (page: Page) =>
  page
    .locator('a, button, summary')
    .evaluateAll((els) =>
      els.filter((el) => el.getBoundingClientRect().height < 44).map((el) => el.textContent),
    );

// 幅が40remを超えても、指で操作する端末ではタップ領域を44px以上にする
for (const [name, viewport] of [
  ['iPhoneの横向き', { width: 844, height: 390 }],
  ['iPad miniの縦向き', { width: 768, height: 1024 }],
] as const) {
  test(`${name}でもリンクとボタンのタップ領域が44px以上`, async ({ browser }) => {
    const page = await (await browser.newContext({ viewport, hasTouch: true })).newPage();
    await page.goto('/');
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    expect(await listSmallTapTargets(page)).toEqual([]);
  });
}

test('モバイルでリンクとボタンのタップ領域が44px以上、文字は13px以上', async ({ browser }) => {
  const page = await (
    await browser.newContext({ viewport: { width: 390, height: 844 } })
  ).newPage();
  await page.goto('/');
  expect(await listSmallTapTargets(page)).toEqual([]);
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

const AXIS_WIDTHS = [320, 360, 390, 430, 640, 641, 667, 700, 741, 760, 800, 1024, 1280];

for (const path of ['/', '/en/']) {
  test(`${path}: 経歴の目盛りの年と「現在」がどの幅でも欠けず重ならない`, async ({ browser }) => {
    const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
    await page.goto(path);
    for (const width of AXIS_WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      const problems = await page.locator('.axis').evaluate((axis) => {
        // 折り返して枠の下に出た年は隠れている。枠からはみ出して一部だけ見える年は欠けている
        const labels = [...axis.querySelectorAll('.tick, .now-label')].flatMap((el) => {
          if (getComputedStyle(el).display === 'none') return [];
          const box = el.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(el);
          const text = range.getBoundingClientRect();
          if (text.top >= box.bottom - 0.5) return [];
          const cut = text.left < box.left - 0.5 || text.right > box.right + 0.5;
          return [{ label: el.textContent ?? '', left: text.left, right: text.right, cut }];
        });
        const years = labels.filter((l) => /^\d{4}$/.test(l.label));
        return [
          ...labels.filter((l) => l.cut).map((l) => `${l.label} cut`),
          ...labels.flatMap((a, i) =>
            labels
              .slice(i + 1)
              .filter((b) => a.left < b.right && b.left < a.right)
              .map((b) => `${a.label}/${b.label}`),
          ),
          ...(labels.some((l) => l.label === 'Now' || l.label === '現在') ? [] : ['now hidden']),
          ...(years.length >= 2 ? [] : [`only ${years.length} years visible`]),
        ];
      });
      expect(problems, `width ${width}`).toEqual([]);
    }
  });
}

// ブラウザの文字サイズ「大」(20px) と「特大」(24px) を、ルートの文字サイズで再現する
const ROOT_FONT_SIZES = ['100%', '125%', '150%'];

for (const path of ['/', '/en/']) {
  test(`${path}: 狭い画面や大きい文字でも横にはみ出さず、経歴の行が軸とそろう`, async ({
    browser,
  }) => {
    const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
    await page.goto(path);
    for (const fontSize of ROOT_FONT_SIZES) {
      const style = await page.addStyleTag({ content: `html { font-size: ${fontSize} }` });
      for (const width of [320, 360, 375, 390, 430]) {
        await page.setViewportSize({ width, height: 800 });
        const layout = await page.evaluate(() => {
          const axis = document.querySelector('.ticks')!.getBoundingClientRect();
          const misaligned = [...document.querySelectorAll('.trace-row')].flatMap((row) => {
            const track = row.querySelector('.track')!.getBoundingClientRect();
            const off = Math.max(
              Math.abs(track.left - axis.left),
              Math.abs(track.right - axis.right),
            );
            return off > 0.5
              ? [`${row.querySelector('.role')?.textContent} ${Math.round(off)}px`]
              : [];
          });
          return { scrollWidth: document.documentElement.scrollWidth, misaligned };
        });
        expect(layout, `font ${fontSize}, width ${width}`).toEqual({
          scrollWidth: width,
          misaligned: [],
        });
      }
      await style.evaluate((el) => (el as HTMLElement).remove());
    }
  });
}

test('存在しないURLでは、サイトの見た目の404ページを返す', async ({ browser }) => {
  const page = await (
    await browser.newContext({ colorScheme: 'dark', viewport: { width: 390, height: 844 } })
  ).newPage();
  const response = await page.goto('/en/no-such-page');
  expect(response?.status()).toBe(404);
  const look = await page.evaluate(() => ({
    background: getComputedStyle(document.body).backgroundColor,
    font: getComputedStyle(document.body).fontFamily,
  }));
  expect(look.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(look.font).toContain('LINE Seed JP');
  await expect(page.getByRole('link', { name: 'トップへ戻る' })).toHaveAttribute('href', '/');
  await expect(page.getByRole('link', { name: /English/ })).toHaveAttribute('href', '/en/');
  expect(await listSmallTapTargets(page)).toEqual([]);
});
