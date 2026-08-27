import test from "node:test";
import assert from "node:assert/strict";
import { combinePortfolio } from "../src/utils/nodeApi.js";

const INT = [
  { scheme_name: "HDFC FLEXI CAP - GROWTH", scheme_bse_code: "HDFC-GR", scheme_category: "Equity", inv_amo: 40000, ret_percentage: 12.5, folio: "111" },
  { scheme_name: "SBI SMALL CAP - GROWTH", scheme_bse_code: "SBI-SC", scheme_category: "Equity", inv_amo: 10000, ret_percentage: -5 },
];
const EXT = [
  { id: 1, scheme_name: "PARAG PARIKH FLEXI CAP", scheme_bse_code: "PPCH-GR", scheme_isin: "INF879O01019", scheme_category: "Hybrid", units: 905.7971, nav: 11.04, invested_amount: 10000 },
];
const navOf = (r) => Number(r.nav) || null;

test("dono side milti hain, totals jurte hain", () => {
  const c = combinePortfolio(INT, EXT, navOf);
  assert.equal(c.rows.length, 3);
  assert.equal(c.totals.invested, 60000);
  // internal: 45000 + 9500 = 54500, external: 905.7971 * 11.04 = 10000 (approx)
  assert.equal(Math.round(c.totals.current), 64500);
  assert.equal(Math.round(c.totals.pnl), 4500);
  assert.equal(c.internal.count, 2);
  assert.equal(c.external.count, 1);
});

test("ek hi scheme dono taraf ho to ek line banti hai, dono badge ke sath", () => {
  const ext = [{ id: 9, scheme_name: "HDFC FLEXI CAP - GROWTH", scheme_bse_code: "HDFC-GR", units: 10, nav: 1000, invested_amount: 8000 }];
  const c = combinePortfolio(INT, ext, navOf);
  assert.equal(c.rows.length, 2); // 3 nahi — HDFC merge ho gayi
  const hdfc = c.rows.find((r) => r.scheme_bse_code === "HDFC-GR");
  assert.deepEqual(hdfc.sources, ["internal", "external"]);
  assert.equal(hdfc.invested, 48000); // 40000 + 8000
  assert.equal(hdfc.current, 55000); // 45000 + 10*1000
});

test("Internal + External hamesha grand total ke barabar", () => {
  const ext = [{ id: 9, scheme_name: "HDFC FLEXI CAP - GROWTH", scheme_bse_code: "HDFC-GR", units: 10, nav: 1000, invested_amount: 8000 }, ...EXT];
  const c = combinePortfolio(INT, ext, navOf);
  // Merged row dono splits mein poora gin liya jaye to ye assert toot jata hai.
  assert.equal(c.internal.invested + c.external.invested, c.totals.invested);
  assert.equal(Math.round(c.internal.current + c.external.current), Math.round(c.totals.current));
  assert.equal(c.internal.count, 2);   // raw holdings, merged rows nahi
  assert.equal(c.external.count, 2);
  assert.equal(c.rows.length, 3);      // HDFC merge hone ke baad
});

test("alag code wali schemes kabhi nahi jurti", () => {
  const c = combinePortfolio(INT, EXT, navOf);
  assert.equal(new Set(c.rows.map((r) => r.key)).size, 3);
});

test("NAV na mile to current = invested, aur unpriced count barhta hai", () => {
  const ext = [{ id: 2, scheme_name: "NO NAV FUND", units: 100, invested_amount: 5000 }];
  const c = combinePortfolio([], ext, () => null);
  assert.equal(c.unpriced, 1);
  assert.equal(c.totals.current, 5000);
  assert.equal(c.totals.pnl, 0); // jhoota P&L nahi
});

test("NAV invested/units se 5x door ho to unpriced — jhoota -99% P&L nahi", () => {
  // 10 units, ₹10k invested → avg ₹1000; NAV ₹11 absurd
  const ext = [{
    id: 3,
    scheme_name: "PARAG PARIKH CONSERVATIVE HYBRID",
    units: 10,
    nav: 11.04,
    invested_amount: 10000,
  }];
  const c = combinePortfolio([], ext, (r) => r.nav);
  assert.equal(c.unpriced, 1);
  assert.equal(c.totals.current, 10000);
  assert.equal(c.totals.pnl, 0);
  assert.equal(c.rows[0].priced, false);
  // published NAV display pe rehti hai; P&L skip
  assert.equal(c.rows[0].nav, 11.04);
});

test("unpriced har external part ginna hai, merged rows nahi", () => {
  const ext = [
    { id: 1, scheme_name: "A", units: 1, invested_amount: 100 },
    { id: 2, scheme_name: "B", units: 1, invested_amount: 100 },
    { id: 3, scheme_name: "C", units: 1, invested_amount: 100 },
  ];
  assert.equal(combinePortfolio([], ext, () => null).unpriced, 3);
});

test("khali portfolio par sab sifar, koi NaN nahi", () => {
  const c = combinePortfolio([], [], navOf);
  assert.equal(c.rows.length, 0);
  assert.equal(c.totals.invested, 0);
  assert.equal(c.totals.pnlPct, 0);
});

test("sirf internal ya sirf external chale to bhi theek", () => {
  assert.equal(combinePortfolio(INT, [], navOf).external.count, 0);
  assert.equal(combinePortfolio([], EXT, navOf).internal.count, 0);
  assert.equal(combinePortfolio(INT, [], navOf).totals.invested, 50000);
});

test("code na ho to name par match, aur alag naam alag line", () => {
  const a = [{ scheme_name: "SOME FUND", inv_amo: 1000, ret_percentage: 0 }];
  const b = [{ id: 3, scheme_name: "some fund", units: 1, nav: 100, invested_amount: 100 }];
  assert.equal(combinePortfolio(a, b, navOf).rows.length, 1); // case-insensitive
  assert.equal(combinePortfolio(a, [{ id: 4, scheme_name: "OTHER FUND", units: 1, nav: 100, invested_amount: 100 }], navOf).rows.length, 2);
});

test("pnlPct invested par nikalta hai", () => {
  const c = combinePortfolio([{ scheme_name: "X", scheme_bse_code: "X", inv_amo: 1000, ret_percentage: 10 }], [], navOf);
  assert.equal(c.totals.pnlPct, 10);
});

test("merged row har side ka hissa alag rakhti hai", () => {
  const ext = [{ id: 9, scheme_name: "HDFC FLEXI CAP - GROWTH", scheme_bse_code: "HDFC-GR", units: 10, nav: 1000, invested_amount: 8000, folio: "EXT-77" }];
  const hdfc = combinePortfolio(INT, ext, navOf).rows.find((r) => r.scheme_bse_code === "HDFC-GR");
  assert.equal(hdfc.parts.length, 2);
  const int = hdfc.parts.find((p) => p.source === "internal");
  const e = hdfc.parts.find((p) => p.source === "external");
  assert.deepEqual([int.invested, int.current, int.folio], [40000, 45000, "111"]);
  assert.deepEqual([e.invested, e.current, e.folio], [8000, 10000, "EXT-77"]);
  // hisse hamesha row ke total ke barabar
  assert.equal(int.invested + e.invested, hdfc.invested);
  assert.equal(int.current + e.current, hdfc.current);
});

test("ek hi side ke do holdings us side ki ek entry banti hain", () => {
  const twoInt = [...INT, { scheme_name: "HDFC FLEXI CAP - GROWTH", scheme_bse_code: "HDFC-GR", inv_amo: 20000, ret_percentage: 0, folio: "222" }];
  const hdfc = combinePortfolio(twoInt, [], navOf).rows.find((r) => r.scheme_bse_code === "HDFC-GR");
  assert.equal(hdfc.parts.length, 1);           // do internal → ek internal entry
  assert.deepEqual(hdfc.sources, ["internal"]); // badge duplicate nahi
  assert.equal(hdfc.parts[0].invested, 60000);
});

test("sources parts se derive hoti hai", () => {
  combinePortfolio(INT, EXT, navOf).rows.forEach((r) =>
    assert.deepEqual(r.sources, r.parts.map((p) => p.source))
  );
});
