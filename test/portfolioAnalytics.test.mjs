import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allocationByMarketValue, benchmarkXirr, fundBucket } from "../src/utils/portfolioAnalytics.js";
import { portfolioXirr } from "../src/utils/xirr.js";

const read = (p) => readFileSync(p, "utf8");
const code = (p) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");

// ── Audit #54 — allocation at market value, stocks included ───────────────────────────────

test("allocation is by market value, by asset class, with stocks in it", () => {
  const rows = allocationByMarketValue(
    [
      // Invested 10k, worth 20k: it must weigh 20k, not the 10k paid.
      { scheme_category: "Equity Scheme - Flexi Cap Fund", inv_amo: 10000, current_value: 20000 },
      { scheme_category: "Debt Scheme - Liquid Fund", inv_amo: 5000, current_value: 5100 },
      { scheme_category: "Other Scheme - Gold ETF FoF", inv_amo: 3000, current_value: 3300 },
      { scheme_category: "Debt Scheme - Corporate Bond Fund", inv_amo: 4000, current_value: 4100 },
      // The feed could not price it: it stays at cost rather than vanishing.
      { scheme_category: "Debt", inv_amo: 1000, current_value: null },
    ],
    [{ symbol: "TCS", qty: 10, ltp: 2075 }]
  );

  assert.deepEqual(
    rows.map((r) => [r.name, Math.round(r.value)]),
    [
      ["Equity (stocks)", 20750],
      ["Equity funds", 20000],
      ["Debt", 5100],
      ["Gold", 3300],
      ["Cash", 5100],
    ]
  );
  assert.equal(Math.round(rows.reduce((a, r) => a + r.pct, 0)), 100);
});

test("liquid is cash, gold is gold, and an unknown fund is not called equity", () => {
  assert.equal(fundBucket("Debt Scheme - Overnight Fund"), "Cash");
  assert.equal(fundBucket("Other Scheme - Gold ETF FoF"), "Gold");
  assert.equal(fundBucket("Hybrid Scheme - Aggressive Hybrid Fund"), "Equity funds");
  assert.equal(fundBucket("Hybrid Scheme - Balanced Advantage"), "Other");
  assert.equal(fundBucket(""), "Other");
  assert.equal(fundBucket("", "HDFC Liquid Fund"), "Cash", "the name is used only when there is no category");
});

// ── Audit #54 — the same cash flows, into the Nifty 50 ────────────────────────────────────

const day = (iso) => Math.floor(Date.parse(`${iso}T09:15:00+05:30`) / 1000);
const order = (date, amount, type = "P") => ({ date, amount, type, status: "ALLOTTED" });

test("the benchmark buys index units on each purchase date and values them at the last close", () => {
  // The index doubles over exactly one year.
  const candles = [
    { time: day("2025-01-01"), close: 100 },
    { time: day("2025-07-01"), close: 150 },
    { time: day("2026-01-01"), close: 200 },
  ];

  const one = benchmarkXirr([order("2025-01-01", 1000)], candles);
  assert.ok(Math.abs(one.xirr - 100) < 0.5, `1000 in at 100, worth 2000 a year later: ~100% p.a., got ${one.xirr}`);

  // Same cash flows as a portfolio that also doubled → the two rates agree.
  const mine = portfolioXirr([order("2025-01-01", 1000)], 2000, new Date(candles[2].time * 1000));
  assert.ok(Math.abs(mine - one.xirr) < 0.5);

  // A redemption sells index units at that day's close.
  const withSale = benchmarkXirr([order("2025-01-01", 1000), order("2025-07-01", 750, "R")], candles);
  assert.ok(withSale.xirr > 0);
});

test("no benchmark when the index history does not reach back to the first cash flow", () => {
  const candles = [{ time: day("2025-06-01"), close: 100 }, { time: day("2026-01-01"), close: 120 }];
  assert.equal(benchmarkXirr([order("2024-01-01", 1000)], candles), null);
  assert.equal(benchmarkXirr([], candles), null);
});

// ── Wiring ────────────────────────────────────────────────────────────────────────────────

test("the investments page shows insights for the selected portfolio and reports its units", () => {
  const dash = code("src/pages/mutual_fund/DashBoardMF.jsx");
  assert.match(dash, /const allocation = useMemo\(\(\) => allocationByMarketValue\(visibleFunds, visibleStocks\)/);
  assert.match(dash, /<PortfolioInsights/);
  assert.match(dash, /laravelUrl\("\/portfolios\/mf-positions"\)/, "alerts need the units this page loads");
  assert.match(dash, /holdingKey\(s, "stock"\)/, "stocks are filtered by portfolio like funds");

  const insights = code("src/components/mutual_fund/PortfolioInsights.jsx");
  assert.match(insights, /nodeUrl\("\/portfolio-metrics"\)/, "risk metrics come from the scheme.js maths in Node");
  assert.match(insights, /benchmarkXirr\(orders, nifty\)/);
  assert.match(insights, /fetchStockChart\("NIFTY", "10y", "1d"\)/);
});

test("a stock is filed into a portfolio as stk:<SYMBOL>", () => {
  assert.match(code("src/hooks/usePortfolios.js"), /source === "stock"\s*\?\s*`stk:\$\{String\(holding\?\.symbol \|\| ""\)\.trim\(\)\.toUpperCase\(\)\}`/);
  assert.match(code("src/pages/stocks/Holdings.jsx"), /assign\(e\.target\.value \? Number\(e\.target\.value\) : null, holdingKey\(stock, "stock"\)\)/);
  assert.match(read("../admin_php/app/Http/Controllers/Api/PortfolioController.php"), /stk:\[A-Z0-9&-\]\{1,32\}/);
});

// ── Audit #55 / #65 ───────────────────────────────────────────────────────────────────────

test("a fund alert is set by picking a fund by name or ISIN, never by typing a BSE code", () => {
  const page = code("src/pages/Notifications.jsx");
  assert.doesNotMatch(page, /BSE scheme code/);
  assert.match(page, /placeholder="Search fund name or ISIN/);
  assert.match(page, /target: row\.scheme_isin \|\| row\.isin \|\| row\.scheme_bse_code/);
  // The runner prices an ISIN target by ISIN.
  assert.match(read("../admin_php/app/Console/Commands/RunAlerts.php"), /preg_match\('\/\^IN\[A-Z0-9\]\{10\}\$\/', \$code\) \? \['isin' => \$code\]/);
});

test("portfolio and market alerts are on the form; SMS is excluded and push remains unavailable", () => {
  const page = code("src/pages/Notifications.jsx");
  assert.match(page, /<option value="portfolio">My whole portfolio<\/option>/);
  assert.match(page, /<option value="index">The market \(Nifty 50 \/ Sensex\)<\/option>/);
  assert.match(page, /<Preferences \/>/);
  assert.doesNotMatch(page, /unavailable\.sms|>SMS<|SMS \(not available\)/);
  assert.match(page, /type="checkbox" disabled title=\{unavailable\.push\}/);
});

// ── Audit #62 / #64 ───────────────────────────────────────────────────────────────────────

test("a basket's expense ratio is a dash until it is real", () => {
  assert.match(read("src/pages/basket/BasketDetails.jsx"), /Number\(details\.metrics\.expenseRatio\) > 0 \? `\$\{details\.metrics\.expenseRatio\}%` : "—"/);
  assert.doesNotMatch(read("../admin_php/app/Http/Controllers/Api/BasketController.php"), /0\.80\s+\*\s+\$weight/);
});

test("reports carry the tax estimate, IDCW entries and the stock view", () => {
  const page = code("src/pages/Reports.jsx");
  assert.match(page, /taxEstimate\(realised\.filter/);
  assert.match(page, /dividendRows\(transactions, dividendsByScheme\)/);
  assert.match(page, /\{tab === "stocks" && <StockReport \/>\}/);
  assert.doesNotMatch(page, /three for everything else/, "the pre-2024 rule text is gone");
});
