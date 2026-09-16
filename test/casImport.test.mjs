// Ticket 16 — the CAS rows the import screen ticks and saves. The PDF parsing itself is
// the backend's (Backend/test/cas.test.js); what is checked here is the part that decides
// whether an imported holding lands on top of one the investor already has.
import test from "node:test";
import assert from "node:assert/strict";
import { casHoldingPayload, casRowKey, markCasDuplicates } from "../src/utils/nodeApi.js";

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

test("cost missing from the statement falls back to current value, never to a fake gain", () => {
  const [row] = markCasDuplicates([{ ...holding, invested_amount: null }], []);
  assert.equal(row.invested_amount, 5533.62); // = statement value, so P&L reads zero
  assert.equal(row.cost_from_statement, false);

  const [known] = markCasDuplicates([holding], []);
  assert.equal(known.invested_amount, 5095.21);
  assert.equal(known.cost_from_statement, true);
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
