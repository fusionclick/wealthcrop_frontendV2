// Run against a preview or live URL with Playwright available through NODE_PATH.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const url = process.argv[2] || 'http://127.0.0.1:5184/';
  try {
    for (const reducedMotion of ['reduce', 'no-preference']) {
      const context = await browser.newContext({ reducedMotion, viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      if (new URL(url).hostname === '127.0.0.1') {
        await page.route('**/market/stock-list?**', route => route.fulfill({ json: { data:
          Array.from({ length: 25 }, (_, i) => ({ symbol: 'TEST'+i, lastPrice: 100+i, pChange: 1 })) } }));
      }
      await page.goto(url);
      const ticker = page.locator('.animate-marquee').first();
      await ticker.waitFor({ timeout: 20000 });
      const transform = () => ticker.evaluate(e => getComputedStyle(e).transform);
      const moves = async () => {
        const before = await transform();
        await page.waitForTimeout(650);
        return before !== await transform();
      };
      assert(await moves(), `Ticker frozen with reducedMotion=${reducedMotion}`);
      const box = await ticker.evaluate(e => {
        const b = e.parentElement.getBoundingClientRect();
        return { x: b.x+80, y: b.y+b.height/2 };
      });
      await page.mouse.move(box.x, box.y);
      assert(await moves(), 'Hover must not freeze the ticker');
      const pause = page.getByRole('button', { name: 'Pause market ticker', exact: true });
      await pause.focus();
      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: 'Resume market ticker', exact: true }).waitFor();
      assert.equal(await moves(), false, 'Explicit pause must stop motion');
      await page.keyboard.press('Enter');
      assert(await moves(), 'Explicit resume must restore motion');
      await page.setViewportSize({ width: 390, height: 844 });
      assert(await moves(), 'Ticker must move on mobile');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, 'Ticker must not introduce horizontal overflow');
      console.log(JSON.stringify({ url, reducedMotion, moving: true, hover: true, keyboardPauseResume: true, mobile: true }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
