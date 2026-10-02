import test from "node:test";
import assert from "node:assert/strict";
import {
  matchLots,
  gainsSummary,
  statementRows,
  unrealisedFromLots,
  assetClassOf,
  toCsv,
  isoDay,
  purchaseLots,
  taxEstimate,
  dividendRows,
} from "../src/utils/taxlots.js";

const buy = (date, units, nav, over = {}) => ({
  id: `b-${date}`,
  date,
  type: "P",
  status: "ALLOTTED",
  scheme_name: "HDFC Flexi Cap Fund",
  scheme_bse_code: "119551",
  units,
  nav,
  amount: units * nav,
  ...over,
});

const sell = (date, units, nav, over = {}) => ({
  ...buy(date, units, nav, over),
  id: `s-${date}`,
  type: "R",
});

test("FIFO sells the oldest units and LIFO the newest, from the same history", () => {
  const orders = [buy("2023-01-10", 100, 10), buy("2024-06-10", 100, 20), sell("2025-02-10", 100, 30)];

  const fifo = matchLots(orders, { method: "fifo" }).realised;
  const lifo = matchLots(orders, { method: "lifo" }).realised;

  assert.equal(fifo.length, 1);
  assert.equal(fifo[0].buy_nav, 10);
  assert.equal(fifo[0].gain, 2000); // 3000 − 1000

  assert.equal(lifo[0].buy_nav, 20);
  assert.equal(lifo[0].gain, 1000); // 3000 − 2000

  // The method changes the tax, which is the entire reason the SRS asks for all three.
  assert.notEqual(fifo[0].gain, lifo[0].gain);
});

test("specific identification consumes the named lot first", () => {
  const orders = [buy("2023-01-10", 100, 10), buy("2024-06-10", 100, 20), sell("2025-02-10", 100, 30)];

  const lots = matchLots(orders, { method: "fifo" });
  const secondLotId = purchaseLots(orders).get("119551")[1].id;

  const specific = matchLots(orders, { method: "specific", picks: { "s-2025-02-10": [secondLotId] } }).realised;

  assert.equal(specific[0].buy_nav, 20, "named lot must be the one sold");
  assert.equal(lots.realised[0].buy_nav, 10, "fifo is unaffected by the pick");
});

test("one redemption spanning two lots produces two gain rows", () => {
  const orders = [buy("2023-01-10", 60, 10), buy("2023-06-10", 60, 15), sell("2025-01-10", 100, 20)];

  const { realised } = matchLots(orders, { method: "fifo" });

  assert.equal(realised.length, 2);
  assert.equal(realised[0].units, 60);
  assert.equal(realised[1].units, 40);
  assert.equal(realised[0].gain + realised[1].gain, 100 * 20 - (60 * 10 + 40 * 15));
});

// Audit #64 — this test used to pin the pre-2024 rule (three years for every non-equity fund).
// The current rules are below, each against the date it took effect.
test("term follows the asset class: a year for equity, and debt bought since Apr 2023 never turns long", () => {
  const equity = matchLots([buy("2024-01-10", 10, 10), sell("2025-03-10", 10, 12)], {
    categories: { 119551: "Flexi Cap" },
  }).realised[0];

  const debt = matchLots([buy("2024-01-10", 10, 10), sell("2025-03-10", 10, 12)], {
    categories: { 119551: "Liquid" },
  }).realised[0];

  assert.equal(equity.term, "long", "14 months in an equity fund is long term");
  assert.equal(debt.term, "short", "a debt fund bought after 1 Apr 2023 is short-term at any age");
  assert.equal(debt.tax_basis, "specified");
  assert.equal(assetClassOf("Short Duration"), "debt");
  assert.equal(assetClassOf(""), "other", "unknown must not claim the long-term rate on our word");
});

test("equity is long-term only after MORE than 12 months — a year to the day is short", () => {
  const at = (sold) =>
    matchLots([buy("2024-01-10", 10, 10), sell(sold, 10, 12)], { categories: { 119551: "Equity" } }).realised[0].term;

  assert.equal(at("2025-01-10"), "short");
  assert.equal(at("2025-01-11"), "long");
});

test("other non-equity funds: 24 months from 23 Jul 2024, 36 months before it", () => {
  // Bought before the specified-fund cut-off, so the holding-period rule applies.
  const sold = (date) =>
    matchLots([buy("2022-01-10", 10, 10), sell(date, 10, 12)], { categories: { 119551: "Gilt" } }).realised[0];

  const after = sold("2024-08-10"); // 31 months, new rules
  const before = sold("2024-06-10"); // 29 months, old rules
  assert.equal(after.term, "long");
  assert.equal(after.tax_basis, "other");
  assert.equal(before.term, "short", "under the old 36-month rule 29 months was short");
});

test("hybrid is no longer always equity, and gold is never debt", () => {
  assert.equal(assetClassOf("Hybrid Scheme - Aggressive Hybrid Fund"), "equity");
  assert.equal(assetClassOf("Hybrid Scheme - Arbitrage Fund"), "equity");
  assert.equal(assetClassOf("Hybrid Scheme - Conservative Hybrid Fund"), "debt");
  assert.equal(assetClassOf("Hybrid Scheme - Dynamic Asset Allocation or Balanced Advantage"), "other");
  assert.equal(assetClassOf("Hybrid"), "other");
  assert.equal(assetClassOf("Other Scheme - Gold ETF"), "other");
  assert.equal(assetClassOf("Other Scheme - Index Funds", "Bharat Bond ETF FoF - April 2030"), "debt");
  assert.equal(assetClassOf("Other Scheme - Index Funds", "UTI Nifty 50 Index Fund"), "equity");
  assert.equal(assetClassOf("", "HDFC Liquid Fund"), "debt", "the name decides only when there is no category");
});

test("tax estimate: current rates, the ₹1.25 lakh exemption and 4% cess", () => {
  const row = (term, tax_basis, gain, date = "2025-11-10") => ({ term, tax_basis, gain, sell_date: new Date(`${date}T00:00:00`) });
  const est = taxEstimate(
    [row("long", "equity", 200000), row("short", "equity", 50000), row("short", "specified", 10000)],
    { slabRate: 0.3 }
  );

  assert.equal(est.tax.equity_ltcg, (200000 - 125000) * 0.125);
  assert.equal(est.tax.equity_stcg, 50000 * 0.2);
  assert.equal(est.tax.slab, 3000);
  assert.equal(Math.round(est.total), Math.round((9375 + 10000 + 3000) * 1.04));

  // Without a slab rate the slab gains are reported, not taxed at a guess.
  const noSlab = taxEstimate([row("short", "specified", 10000)]);
  assert.equal(noSlab.tax.slab, null);
  assert.equal(noSlab.slabPending, true);
});

test("tax estimate: losses set off the way s.70 / s.74 allow", () => {
  const row = (term, tax_basis, gain) => ({ term, tax_basis, gain, sell_date: new Date("2025-11-10T00:00:00") });

  // A short-term loss can reduce a long-term gain…
  const st = taxEstimate([row("short", "equity", -30000), row("long", "equity", 180000)]);
  assert.equal(st.gains.equity_ltcg, 150000);
  assert.equal(st.tax.equity_ltcg, (150000 - 125000) * 0.125);

  // …a long-term loss only a long-term gain, never a short-term one.
  const lt = taxEstimate([row("long", "equity", -20000), row("short", "equity", 50000)]);
  assert.equal(lt.gains.equity_stcg, 50000);
  assert.equal(lt.carriedForward, 20000);
});

test("tax estimate: FY 2024-25 blends the rates either side of 23 Jul 2024", () => {
  const est = taxEstimate([
    { term: "short", tax_basis: "equity", gain: 10000, sell_date: new Date("2024-06-01T00:00:00") },
    { term: "short", tax_basis: "equity", gain: 10000, sell_date: new Date("2024-09-01T00:00:00") },
  ]);

  assert.equal(est.tax.equity_stcg, 1500 + 2000);
});

test("IDCW entries use the units held on the record date", () => {
  const statement = statementRows([buy("2024-01-10", 100, 10), buy("2024-06-10", 50, 12)]);
  const rows = dividendRows(statement, {
    119551: [
      { record_date: "2024-03-15", amount_per_unit: 0.5, kind: "payout" },
      { record_date: "2024-07-15", amount_per_unit: 0.5, kind: "reinvest" },
      { record_date: "2023-12-01", amount_per_unit: 0.5, kind: "payout" }, // before any units
    ],
  });

  assert.equal(rows.length, 2);
  assert.equal(rows[0].amount, 50); // 100 units
  assert.equal(rows[1].amount, 75); // 150 units
  assert.match(rows[1].description, /reinvested/);
});

test("units sold with no purchase on record are reported, not invented", () => {
  const { realised, unmatched } = matchLots([buy("2024-01-10", 10, 10), sell("2024-06-10", 25, 12)]);

  assert.equal(realised.length, 1);
  assert.equal(realised[0].units, 10);
  assert.equal(unmatched.length, 1);
  assert.equal(Math.round(unmatched[0].units), 15);
});

test("pending and rejected orders never reach the report", () => {
  const { realised, openLots } = matchLots([
    buy("2024-01-10", 10, 10, { status: "REJECTED" }),
    buy("2024-02-10", 10, 10, { status: "PENDING" }),
    buy("2024-03-10", 10, 10),
    sell("2024-09-10", 10, 12),
  ]);

  assert.equal(realised.length, 1);
  assert.equal(isoDay(realised[0].buy_date), "2024-03-10");
  assert.equal(openLots.length, 0);
});

test("the summary splits short and long, and gains from losses", () => {
  const realised = [
    { term: "short", gain: 500, proceeds: 1500, cost: 1000 },
    { term: "short", gain: -200, proceeds: 800, cost: 1000 },
    { term: "long", gain: 3000, proceeds: 9000, cost: 6000 },
  ];

  const s = gainsSummary(realised);

  assert.equal(s.short_gain, 500);
  assert.equal(s.short_loss, 200);
  assert.equal(s.short_net, 300);
  assert.equal(s.long_net, 3000);
  assert.equal(s.net, 3300);
});

test("a statement carries a running unit balance per scheme", () => {
  const rows = statementRows([buy("2024-01-10", 100, 10), buy("2024-02-10", 50, 12), sell("2024-03-10", 30, 15)]);

  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((r) => r.balance_units), [100, 150, 120]);
  assert.equal(rows[0].description, "Purchase");
  assert.equal(rows[2].description, "Redemption");
  assert.ok(rows[2].amount < 0, "a redemption is money out of the fund, not into it");
});

test("unrealised gains value open lots at today's NAV", () => {
  const { openLots } = matchLots([buy("2024-01-10", 100, 10)]);
  const rows = unrealisedFromLots(openLots, { 119551: 14 });

  assert.equal(rows[0].value, 1400);
  assert.equal(rows[0].gain, 400);
});

test("CSV quotes what needs quoting", () => {
  const csv = toCsv([{ a: 'He said "hi"', b: new Date("2025-01-02") }], [
    { key: "a", label: "Note" },
    { key: "b", label: "Date" },
  ]);

  assert.equal(csv, 'Note,Date\n"He said ""hi""",2025-01-02');
});

test("a lot keeps the same id whatever method is used to consume it", () => {
  const orders = [buy("2023-01-10", 100, 10), buy("2024-06-10", 100, 20), sell("2025-02-10", 50, 30)];

  const fifoId = matchLots(orders, { method: "fifo" }).realised[0].lot_id;
  const lifoId = matchLots(orders, { method: "lifo" }).realised[0].lot_id;
  const catalogue = purchaseLots(orders).get("119551").map((l) => l.id);

  assert.ok(catalogue.includes(fifoId));
  assert.ok(catalogue.includes(lifoId));
  assert.notEqual(fifoId, lifoId);
});

test("a sale cannot be matched against units bought after it", () => {
  const { realised, unmatched } = matchLots([
    buy("2024-06-10", 10, 10),
    sell("2024-03-10", 10, 12), // before the purchase
  ]);

  assert.equal(realised.length, 0, "the units did not exist on the sale date");
  assert.equal(unmatched.length, 1);
});
