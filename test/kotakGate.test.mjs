// node --test — the stocks Kotak gate: who it covers, what it asks for, where it sends people.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(p, "utf8");
const gate = read("src/components/stocks/KotakGate.jsx");
const form = read("src/components/stocks/KotakLinkForm.jsx");
const app = read("src/App.jsx");
const api = read("src/api/portfolioApi.js");

test("the gate sends investors to the Wealthcrop partner onboarding link", () => {
  assert.match(
    gate,
    /https:\/\/www\.kotakneo\.com\/landing-page\/franchisee\/open-demat-account-partner-wealthcrop-securities-private-limited-one\//,
  );
  assert.match(gate, /Login for stocks/);
  assert.match(gate, /target="_blank"/);
  assert.match(gate, /rel="noopener noreferrer"/, "a new tab to an external site needs this");
});

test("it gates stocks and F&O, and leaves mutual funds alone", () => {
  // Mutual funds go through BSE, not Kotak — gating them would block a working flow.
  const sections = app.split("<Route element={<KotakGate />}>");
  assert.equal(sections.length, 3, "exactly two gated sections");
  // each gated group runs until the blank line that separates route groups
  const [stocks, fno] = sections.slice(1).map((part) => part.split(/\n\s*\n/)[0]);
  assert.match(stocks, /path="\/user\/stocks"/);
  assert.match(fno, /path="\/user\/future_and_options"/);
  assert.doesNotMatch(stocks, /mutual_fund/);
  assert.doesNotMatch(fno, /mutual_fund/);
});

test("access token and UCC are the required pair", () => {
  assert.match(form, /access_token: ""/);
  assert.match(form, /ucc: ""/);
  assert.match(form, /if \(!payload\.access_token \|\| !payload\.ucc\)/);
  // Kotak stores UCCs upper-case; sending "wc1234" would not match the account.
  assert.match(form, /ucc: e\.target\.value\.toUpperCase\(\)/);
});

test("the credentials call posts the whole payload, not just MPIN and TOTP", () => {
  assert.match(api, /export const saveKotakCredentials = \(payload\) =>/);
  assert.doesNotMatch(api, /totp_secret: totpSecret/, "the old two-argument shape is gone");
});

test("a status the app cannot read does not nag the investor", () => {
  // The order endpoints refuse an unlinked investor server-side, so the modal is a prompt.
  assert.match(gate, /\.catch\(\(\) => setLinked\(true\)\)/);
});
