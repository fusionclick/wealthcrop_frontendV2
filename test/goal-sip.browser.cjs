const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const origin = process.argv[2] || 'http://127.0.0.1:5184';
  const fund = { name: 'QA Regular Growth Fund', scheme_isin: 'INF179K01XQ0', scheme_bse_code: 'QA_REG', minSip: 500, sip_allowed: true };
  try {
    for (const linked of [false, true]) {
      const context = await browser.newContext();
      await context.addInitScript(() => {
        localStorage.setItem('token', 'browser-test-only');
        localStorage.setItem('pin_set', 'true');
        localStorage.setItem('pin_expiry', String(Date.now()+1800000));
      });
      const page = await context.newPage();
      const registrations = [];
      await page.route('**/*', route => {
        const req = route.request();
        if (!['xhr', 'fetch'].includes(req.resourceType())) return route.continue();
        if (req.url().includes('xspRegister')) registrations.push(req.url());
        let json = { status: true, data: { data: [] } };
        if (req.url().endsWith('/goals')) json = { status: true, data: [{ id: 1, name: 'Education QA', type: 'education', target_amount: 1000000,
          target_future: 1338225, inflation_pct: 6, target_date: '2031-10-14', months_left: 60, saved_amount: 0, on_track: true, planned_now: 0, plan: { start_date: '2026-10-14' },
          required_monthly: 5000, monthly_contribution: 1000, status: 'active', links: linked ? [{ scheme_bse_code: fund.scheme_bse_code }] : [] }] };
        if (req.url().includes('master-scheme-list')) json = { status: 'success', data: { lists: [fund] } };
        if (req.url().includes('scheme-details')) json = { status: 'success', data: { scheme_info: { minSip: 500 } } };
        return route.fulfill({ json });
      });
      await page.goto(origin+'/goals');
      await page.getByText('Shortfall: Increase SIP by ₹4,000/mo', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Top-up / Step-Up SIP', exact: true }).click();
      await page.getByText('Monthly Amount (₹)', { exact: true }).waitFor();
      const amount = page.getByRole('spinbutton').first();
      await amount.waitFor();
      assert.equal(await amount.inputValue(), '4000');
      assert.equal(new URL(page.url()).searchParams.get('amount'), '4000');
      assert.equal(new URL(page.url()).pathname, linked ? '/mutual_fund/QA_REG/sip' : '/mutual_fund/sip-setup');
      if (!linked) {
        assert(await page.getByRole('button', { name: 'Start SIP', exact: true }).isDisabled());
        await page.getByRole('combobox', { name: 'Choose a fund for this SIP', exact: true }).click();
        await page.getByRole('option', { name: /QA Regular Growth Fund/ }).click();
        await page.getByRole('heading', { name: 'QA Regular Growth Fund', exact: true }).waitFor();
        assert.equal(await amount.inputValue(), '4000', 'Choosing a fund must retain the goal amount');
      }
      await page.reload();
      await amount.waitFor();
      assert.equal(await amount.inputValue(), '4000', 'Reload must preserve the shortfall amount');
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(registrations.length, 0, 'Navigation must not register a SIP');
      await page.goto(origin+'/mutual_fund/sip-setup');
      await page.waitForURL('**/user/mutual_fund/explore');
      console.log(JSON.stringify({ linked, shortfallPrefilled: true, fundChoiceRetainsAmount: true, reload: true, emptySetupRedirect: true, registrations: 0 }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
