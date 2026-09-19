// Ticket 16 — the CAS rows the import screen ticks and saves. The PDF parsing itself is
// the backend's (Backend/test/cas.test.js); what is checked here is the part that decides
// whether an imported holding lands on top of one the investor already has.
import test from "node:test";
import assert from "node:assert/strict";
import { casHoldingPayload, casRowKey, markCasDuplicates, nameDiffers } from "../src/utils/nodeApi.js";

const holding = {
  scheme_name: "HDFC Liquid Fund - Growth Option",
  matched_name: "HDFC Liquid Fund - Regular Plan - Growth",
  scheme_isin: "INF179K01XQ0",
  scheme_bse_code: "HDFC123",
  scheme_category: "Debt",
  folio: "12345678/90",
  units: 125.178,
  nav: 44.21,
  statement_value: 5533.62,
  invested_amount: 5095.21,
  purchased_at: "2024-04-02",
  source: "CAS (CAMS)",
};

test("identity is ISIN + folio, so one fund in two folios stays two holdings", () => {
  assert.equal(casRowKey(holding), "INF179K01XQ0|12345678/90");
  assert.notEqual(casRowKey(holding), casRowKey({ ...holding, folio: "99887766" }));
  // Spelling differs between a statement and a hand-typed row; the ISIN does not.
  assert.equal(casRowKey({ ...holding, scheme_name: "HDFC LIQUID GROWTH" }), casRowKey(holding));
});

test("a holding already in the portfolio is flagged, not silently re-added", () => {
  const existing = [{ scheme_isin: "INF179K01XQ0", folio: "12345678 / 90" }];
  const [same, other] = markCasDuplicates([holding, { ...holding, folio: "99887766" }], existing);
  assert.equal(same.duplicate, true);
  assert.equal(other.duplicate, false);
});

test("cost missing from the statement is left blank, never guessed", () => {
  // This used to pre-fill the market value, reasoned as a neutral stand-in that makes P&L
  // read zero. It is not neutral: it states the investor put in 77,000 when the statement
  // says no such thing, and anyone who missed the warning saved that as their cost basis.
  // The purchases the statement DOES show are no better a default — they would claim a
  // 285% gain. Neither figure is known, so neither is offered as an answer.
  const [row] = markCasDuplicates([{ ...holding, invested_amount: null, visible_cost: 20000 }], []);
  assert.equal(row.invested_amount, "", "blank, so the investor has to say");
  assert.equal(row.cost_from_statement, false);
  assert.equal(row.visible_cost, 20000, "offered separately, as something to accept");

  const [known] = markCasDuplicates([holding], []);
  assert.equal(known.invested_amount, 5095.21);
  assert.equal(known.cost_from_statement, true);
});

test("the market value is never used as a cost basis", () => {
  const [row] = markCasDuplicates([{ ...holding, invested_amount: null }], []);
  assert.notEqual(row.invested_amount, holding.statement_value);
});

test("the saved body matches what the Add Fund form posts", () => {
  const [row] = markCasDuplicates([holding], []);
  assert.deepEqual(casHoldingPayload(row), {
    // The catalogue's name wins — that is the one the NAV socket and fund page use.
    scheme_name: "HDFC Liquid Fund - Regular Plan - Growth",
    scheme_isin: "INF179K01XQ0",
    scheme_bse_code: "HDFC123",
    scheme_category: "Debt",
    nav: 44.21,
    units: 125.178,
    invested_amount: 5095.21,
    folio: "12345678/90",
    source: "CAS (CAMS)",
    purchased_at: "2024-04-02",
  });
});

test("a fund the catalogue does not carry still saves, on the statement's own NAV", () => {
  const payload = casHoldingPayload({
    scheme_name: "Some Closed AMC Fund",
    scheme_isin: "INF000000000",
    units: 10,
    nav: 12.5,
    invested_amount: 100,
  });
  assert.equal(payload.scheme_name, "Some Closed AMC Fund");
  assert.equal(payload.scheme_bse_code, "");
  assert.equal(payload.nav, 12.5);
  assert.equal(payload.purchased_at, null);
});

/**
 * QA read "HDFC Liquid Fund" on the statement and "HDFC MID-CAP OPPORTUNITIES FUND" in the
 * UI and called the matcher broken. It was not: INF179K01XQ0 really is HDFC Mid Cap Fund,
 * and the sample PDF had been written with an ISIN that did not belong to the name beside
 * it. The ISIN wins — it is the identifier — but swapping the name silently is alarming and
 * hides the case where a statement genuinely carries a wrong ISIN.
 */
test("a matched name that contradicts the statement is flagged, not swapped silently", () => {
  assert.equal(
    nameDiffers({ scheme_name: "HDFC123-HDFC Liquid Fund - Growth Option", matched_name: "HDFC Mid Cap Fund" }),
    true,
    "Liquid and Mid Cap are different funds"
  );
});

test("the same fund spelled differently is not flagged", () => {
  // RTA prefix, plan and option words differ; the fund does not.
  assert.equal(
    nameDiffers({ scheme_name: "HDFC777-HDFC Flexi Cap Fund - Direct Plan - Growth", matched_name: "HDFC Flexi Cap Fund" }),
    false
  );
  assert.equal(
    nameDiffers({
      scheme_name: "128TSDGG-Axis ELSS Tax Saver Fund - Regular Plan - Growth",
      matched_name: "Axis ELSS- Tax Saver Fund",
    }),
    false
  );
  // Nothing to compare against — an unmatched row already says "not in our catalogue".
  assert.equal(nameDiffers({ scheme_name: "Whatever Fund", matched_name: "" }), false);
  assert.equal(nameDiffers({}), false);
});

/**
 * QA: "the Axis ELSS NAV is being overridden — UI shows 96.57 instead of the statement's
 * 110.00". Today's price is the right number to value a holding with; a CAS prints its NAV
 * as at the statement's closing date, and valuing now at an 18-month-old price would be
 * wrong. But replacing the only NAV on screen looked like the import had altered a figure
 * printed on the document. Both are carried.
 */
test("the statement's own NAV survives beside today's", () => {
  const [row] = markCasDuplicates(
    [{ ...holding, nav: 96.5733, statement_nav: 110, nav_date: "2025-03-31", nav_source: "catalogue" }],
    []
  );
  assert.equal(row.nav, 96.5733, "today's price values the holding");
  assert.equal(row.statement_nav, 110, "and the statement's is still there to show");
  assert.equal(row.nav_source, "catalogue");
});

test("an unmatched row reports its NAV as coming from the statement", () => {
  const [row] = markCasDuplicates([{ ...holding, nav: 44.21 }], []);
  assert.equal(row.nav_source, "statement");
  assert.equal(row.statement_nav, null, "nothing was replaced, so there is no second number");
});

/**
 * A holding whose ISIN names a different fund than the statement is not ticked by default.
 * The ISIN is the identifier and is almost always right — but "almost always" is not enough
 * to start tracking a fund the investor may not own, so importing it becomes a decision.
 */
test("a row whose ISIN names a different fund is offered unticked", async () => {
  const src = await import("node:fs").then((fs) =>
    fs.readFileSync("src/components/mutual_fund/CasImport.jsx", "utf8")
  );
  assert.match(src, /!r\.duplicate && !nameDiffers\(r\)/);
});

test("a row that agrees with the statement is still ticked", () => {
  // Same-fund spellings must not be caught by that rule, or nothing would be pre-ticked.
  assert.equal(
    nameDiffers({ scheme_name: "HDFC777-HDFC Flexi Cap Fund - Direct Plan - Growth", matched_name: "HDFC Flexi Cap Fund" }),
    false
  );
  assert.equal(nameDiffers({ scheme_name: "Axis ELSS Tax Saver Fund", matched_name: "" }), false);
});
