import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DASH, fmtCrore, fmtPrice, stockFundamentals, weekRange } from "../src/utils/stockFacts.js";

const read = (p) => readFileSync(p, "utf8");
// Look at code, not at the comments explaining what used to be there.
const code = (p) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");

const RELIANCE = {
  priceInfo: { lastPrice: 1167.7, weekHighLow: { max: 1611.8, min: 1160.8 } },
  stats: { pe: 21.15, eps: 55.2, book_value: 668.045, market_cap: 15801867304960, dividend_yield: 0.0051, beta: 0.152 },
  // The NSE fields the three tiles used to read. They must not leak into the grid.
  metadata: { pdSectorPe: 19.9, pdSymbolPe: 21 },
  securityInfo: { issuedSize: 13532472634 },
};

const value = (rows, label) => rows.find((r) => r.label === label)?.value;

// Audit #53 — "EPS" printed the sector P/E, "Book Value" the base price.
test("each fundamentals tile prints the field its label names", () => {
  const rows = stockFundamentals(RELIANCE, { ratios: { return_on_equity: 0.0912, debt_to_equity: 36.653 } });

  assert.equal(value(rows, "EPS (TTM)"), "₹55.20");
  assert.equal(value(rows, "Book Value"), "₹668.05");
  assert.equal(value(rows, "P/E (TTM)"), "21.15");
  assert.equal(value(rows, "Market Cap"), "₹15,80,187 Cr");
  assert.equal(value(rows, "Dividend Yield"), "0.51%");
  assert.equal(value(rows, "Beta"), "0.15");
  assert.equal(value(rows, "ROE"), "9.12%");
  // Yahoo's debt/equity is a percentage: 36.65 is 0.37×, not 36.65×.
  assert.equal(value(rows, "Debt/Equity"), "0.37");
});

test("what the provider did not send is a dash, never a zero", () => {
  const rows = stockFundamentals({ priceInfo: { lastPrice: 100 } }, null);
  for (const row of rows) assert.equal(row.value, DASH, `${row.label} must be "—" when unknown`);

  assert.equal(weekRange({ priceInfo: { weekHighLow: { max: null, min: null } } }), DASH);
  assert.equal(weekRange({ priceInfo: { weekHighLow: { max: 0, min: 0 } } }), DASH, "₹0–₹0 is not a range");
  assert.equal(weekRange(RELIANCE), "₹1,160.80 – ₹1,611.80");
  assert.equal(fmtPrice(0), DASH);
  assert.equal(fmtCrore(null), DASH);
});

test("the stock page reads stats and fundamentals, not the empty NSE fields", () => {
  const page = code("src/components/StockDetails.jsx");
  assert.doesNotMatch(page, /pdSectorPe|basePrice|issuedSize|pdSymbolPe/, "a tile still reads an NSE field nothing fills");
  assert.match(page, /fetchFundamentals\(name\)/, "the fundamentals endpoint must actually be called");
  assert.match(page, /fmtVolume\(stats\.avg_volume_3m\)/, "Avg Volume (3M) must be a volume");
  assert.match(page, /analyst\?\.recommendation/, "the analyst tile must read the consensus");
  assert.doesNotMatch(page, /Live market data/, "the hard-coded analyst placeholder is back");
  assert.doesNotMatch(page, /href="#"/, "dead links are back");
});

// Audit #52
test("Explore no longer labels the gainers list as news or as most valuable", () => {
  const explore = code("src/pages/stocks/Explore.jsx");
  assert.doesNotMatch(explore, /Stocks in News/);
  assert.doesNotMatch(explore, /Most Valuable/);
  assert.doesNotMatch(explore, /Most bought stocks on Wealthcrop/);
  // A gainer needs a price; an unpriced row's pChange of 0 is not a move.
  assert.match(explore, /const sorted = stocks\.filter\(\(s\) => Number\(s\.lastPrice\) > 0\)/);
});

test("an unpriced row reads — on every stock list, never ₹0 or +0%", () => {
  const list = code("src/pages/stocks/StockList.jsx");
  assert.match(list, /item\.price \? `\$\{item\.percent >= 0 \? "\+" : ""\}\$\{item\.percent\.toFixed\(2\)\}%` : "—"/);
  const watch = code("src/pages/stocks/Watchlist.jsx");
  assert.doesNotMatch(watch, /₹\{item\.price\}/);
  assert.match(watch, /Number\(item\.price\) > 0 \? `₹\$\{item\.price\}` : "—"/);
});

test("the markets page shows rupee rates and is honest that news is not connected", () => {
  const page = code("src/pages/MarketNewsPage.jsx");
  assert.match(page, /fetchFxRates\(\)/);
  assert.match(page, /Market news isn’t connected yet/);
  assert.doesNotMatch(page, /curated by Wealthcrop analysts/, "no analysts curate anything");
  assert.match(read("src/api/marketApi.js"), /\/market\/fx/);
});
