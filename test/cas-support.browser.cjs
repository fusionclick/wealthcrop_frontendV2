const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const origin = process.argv[2] || 'http://127.0.0.1:5184';
  try {
    for (const signedIn of [false, true]) {
      const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
      const page = await context.newPage();
      await page.route('**/*', route => {
        const req = route.request();
        if (['xhr', 'fetch'].includes(req.resourceType())) {
          return route.fulfill({ json: { status: true, data: req.url().includes('platform-settings')
            ? { website_enabled: true, play_store_url: origin+'/downloads/wealthcrop-1.0.0.apk', whatsapp_number: '' }
            : { data: [] } } });
        }
        return route.continue();
      });
      if (signedIn) await context.addInitScript(() => {
        localStorage.setItem('token', 'browser-test-only');
        localStorage.setItem('pin_set', 'true');
        localStorage.setItem('pin_expiry', String(Date.now()+1800000));
      });
      await page.goto(origin+'/');
      const cas = page.getByRole('link', { name: 'Upload CAS', exact: true });
      assert.equal(await cas.getAttribute('href'), signedIn ? '/user/mutual_fund/external?cas=1' : '/track');
      await cas.click();
      if (signedIn) {
        await page.getByRole('heading', { name: 'External Portfolio', exact: true }).waitFor();
        await page.locator('input[type=file]').waitFor();
        assert.equal(await page.getByText('Create your account').count(), 0);
      } else {
        await page.getByRole('heading', { name: 'Create your account ✨' }).waitFor();
        const modal = page.locator('.scrollbar-hidden');
        assert(await modal.evaluate(e => e.scrollHeight <= e.clientHeight+1), 'Desktop registration must fit without scrolling');
        for (const viewport of [{ width: 390, height: 844 }, { width: 390, height: 450 }]) {
          await page.setViewportSize(viewport);
          assert.equal(await modal.evaluate(e => getComputedStyle(e).scrollbarWidth), 'none');
          await page.getByRole('link', { name: 'Login', exact: true }).last().scrollIntoViewIfNeeded();
          assert(await page.getByRole('link', { name: 'Login', exact: true }).last().isVisible());
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        }
      }
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(origin+'/');
      await page.getByRole('link', { name: 'Email Support', exact: true }).click();
      await page.getByText('No mail app opened? Use Gmail or copy the address.').waitFor();
      assert((await page.getByRole('link', { name: 'Open Gmail', exact: true }).getAttribute('href')).includes('to=support%40wealthcrop.in'));
      await page.getByRole('button', { name: 'Copy email', exact: true }).click();
      await page.getByRole('button', { name: 'Copied', exact: true }).waitFor();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'support@wealthcrop.in');
      assert.equal(await page.getByRole('button', { name: 'WhatsApp chat', exact: true }).count(), 0);
      await page.getByRole('link', { name: 'Download Android APK', exact: true }).first().waitFor();
      assert(await page.locator('svg').count() > 0);
      console.log(JSON.stringify({ signedIn, casDestination: 'pass', registrationLayout: 'pass', emailFallback: 'pass', apkLinks: 'pass', whatsappHidden: true }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
