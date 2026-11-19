import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';

const PASS_SCORE = 95;
const DEBUGGING_PORT = 9222;
const CATEGORIES = ['performance', 'accessibility'];
const baseUrl = `http://localhost:${process.env.E2E_PORT ?? '8787'}`;

const browser = await chromium.launch({ args: [`--remote-debugging-port=${DEBUGGING_PORT}`] });
let failed = false;

try {
  for (const path of ['/', '/en/']) {
    const result = await lighthouse(`${baseUrl}${path}`, {
      port: DEBUGGING_PORT,
      output: 'json',
      logLevel: 'error',
      onlyCategories: CATEGORIES,
    });
    for (const id of CATEGORIES) {
      const score = Math.round((result?.lhr.categories[id]?.score ?? 0) * 100);
      console.log(`${path} ${id}: ${score}`);
      if (score < PASS_SCORE) failed = true;
    }
  }
} finally {
  await browser.close();
}

process.exit(failed ? 1 : 0);
