// Audit #31-#35 — checkout disclosures, the RM-assisted path, the grievance thread and the
// consent view. Pure helpers are tested as functions; screens by their source, like the rest
// of this suite (comments stripped, so a note about a rule never satisfies the rule).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { wireAcks, isAcknowledged } from "../src/utils/disclaimerAcks.js";
import { schemeDocsFor, SEBI_SID_REGISTER, selectedSchemeDocuments } from "../src/utils/schemeDocs.js";
import { amcLogoUrl } from "../src/utils/amcLogo.js";

const code = (p) =>
  readFileSync(p, "utf8")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");

// ── #33 the consent matrix, as the checkout declares it ─────────────────────────────────

test("execution-only by default; assisted sends the named EUIN in its place, never both", () => {
  const ticked = ["market_risk", "execution_only", "scheme_documents"];
  assert.deepEqual(wireAcks(ticked, ""), ["market_risk", "scheme_documents", "execution_only"]);

  // Assisted: the execution-only tick is not carried over — the two statements contradict.
  assert.deepEqual(wireAcks([...ticked, "rm_assisted"], "E123456"), ["market_risk", "scheme_documents", "rm_assisted:E123456"]);
  // Assisted but the RM box not ticked: nothing declared about who placed it.
  assert.deepEqual(wireAcks(["market_risk", "execution_only"], "E123456"), ["market_risk"]);
});

test("the server's execution_only requirement is met by the RM tick only when assisted", () => {
  assert.equal(isAcknowledged("execution_only", ["execution_only"], ""), true);
  assert.equal(isAcknowledged("execution_only", ["execution_only"], "E123456"), false);
  assert.equal(isAcknowledged("execution_only", ["rm_assisted"], "E123456"), true);
  assert.equal(isAcknowledged("market_risk", ["rm_assisted"], "E123456"), false);
});

test("the checkout offers 'assisted by' from the register and sends the wire form", () => {
  const src = code("src/components/mutual_fund/OrderDisclaimers.jsx");
  assert.match(src, /const acked = wireAcks\(checked, rmEuin\)/);
  assert.match(src, /rms: Array\.isArray\(data\?\.rms\)/, "the register comes from /disclaimers");
  assert.match(src, /offerRm \? <AssistedBy/, "no RM choice is rendered");
  assert.match(src, /fill\(text\[RM_KEY\], rm\)/, "the RM declaration must name the RM");
});

// ── #32 checkout disclosures ─────────────────────────────────────────────────────────────

test("direct document links are matched to the selected scheme and logos require a supplied source", () => {
  const media = [{ scheme_bse_code: "A", scheme_isin: "INF123456789", scheme_name: "Example Fund", sid: "https://amc.test/sid.pdf", sai: "https://amc.test/sai.pdf", kim: "https://amc.test/kim.pdf", logo_url: "https://amc.test/logo.png" }];
  const [selected, other] = selectedSchemeDocuments([{ code: "A" }, { code: "B", name: "Example Fund" }], media);
  assert.equal(selected.available, true);
  assert.equal(selected.sid, media[0].sid);
  assert.equal(other.available, false, "a name cannot override a different selected scheme code");
  assert.equal(amcLogoUrl("Example Fund"), "");
  assert.equal(amcLogoUrl("EXAMPLE FUND", media), media[0].logo_url);
  assert.equal(amcLogoUrl("Another Fund", media), "");
});

test("scheme documents come from one map, with SEBI's register when the house is unknown", () => {
  assert.deepEqual(schemeDocsFor("SBI BLUECHIP FUND - REGULAR PLAN - GROWTH"), {
    amc: "SBI Mutual Fund",
    url: "https://www.sbimf.com/offer-document-sid-kim",
  });
  assert.equal(schemeDocsFor("Kotak Mahindra Flexicap Fund").amc, "Kotak Mahindra Mutual Fund");
  assert.equal(schemeDocsFor("Mahindra Manulife Liquid Fund").amc, "Mahindra Manulife Mutual Fund");
  assert.equal(schemeDocsFor("Aditya Birla Sun Life Frontline Equity").amc, "Aditya Birla Sun Life Mutual Fund");
  assert.deepEqual(schemeDocsFor("Some New AMC Flexi Cap"), { amc: null, url: SEBI_SID_REGISTER });
  assert.deepEqual(schemeDocsFor(""), { amc: null, url: SEBI_SID_REGISTER });
});

test("checkout notices are readable: nothing under 13px", () => {
  const src = code("src/components/mutual_fund/OrderDisclaimers.jsx");
  assert.doesNotMatch(src, /text-\[(9|10|11|12)px\]|text-xs/, "a notice the investor signs must not be 11px");
  assert.match(src, /text-\[13px\]/);
});

test("checkout finds its scheme without the page passing it (route, then router state)", () => {
  const src = code("src/components/mutual_fund/OrderDisclaimers.jsx");
  assert.match(src, /const \{ isin, code \} = useParams\(\)/);
  assert.match(src, /useLocation\(\)\.state/);
  assert.match(src, /schemeName=\{scheme\}/);
});

test("a SIP top-up shows the disclaimers and sends the acknowledgement the server now gates on", () => {
  const src = code("src/components/sip/ManageSipPage.jsx");
  const modal = src.slice(src.indexOf("const TopUpSipModal"), src.indexOf("const ModifySipPage"));
  assert.match(modal, /const disc = useDisclaimers\(\)/);
  assert.match(modal, /<OrderDisclaimers \{\.\.\.disc\}/);
  assert.match(modal, /onConfirm\(\{ amount, freq, acknowledged: disc\.acked \}\)/);
  assert.match(modal, /disabled=\{saving \|\| belowMin \|\| !disc\.ready\}/);
  assert.match(src, /const confirmTopUp = async \(\{ amount, freq, startDate, acknowledged \}\)/);
});

// ── #33 the mandate consent names the mandate ────────────────────────────────────────────

test("the auto-debit consent names the mandate the investor chose: UPI AutoPay or e-NACH", () => {
  const src = code("src/components/mutual_fund/EnachAuthorization.jsx");
  // It said "(e-NACH)" whatever was chosen — including UPI AutoPay, the default.
  assert.doesNotMatch(src, /Auto-Debit Authorization \(e-NACH\)/);
  assert.match(src, /Auto-Debit Authorization \(\{mandateLabel\(mode\)\}\)/);
  assert.match(src, /Auto-Debit Authorization \(\{mandateLabel\(result\.mode \|\| mode\)\}\)/);
});

// ── #35 grievance thread ─────────────────────────────────────────────────────────────────

test("the investor can read replies and resolution notes, and reply, in the app", () => {
  const src = code("src/pages/Grievance.jsx");
  // The bare "/grievances" path was answered by the SPA, not by Laravel.
  assert.match(src, /const api = \(path\) => laravelUrl\(path\)/);
  assert.doesNotMatch(src, /WithToken\("\/grievances/);
  assert.match(src, /api\(`\/grievances\/\$\{encodeURIComponent\(reference\)\}`\)/);
  assert.match(src, /thread\.replies/);
  assert.match(src, /thread\.resolution_notes/);
  assert.match(src, /api\(`\/grievances\/\$\{encodeURIComponent\(reference\)\}\/reply`\)/);
  // The notification links here with ?ref=, which opens that thread.
  assert.match(src, /params\.get\("ref"\)/);
});

// ── #33 profile → Consents ───────────────────────────────────────────────────────────────

test("the investor can see their consent trail under profile → Data & privacy", () => {
  const src = code("src/pages/profile/DataRights.jsx");
  assert.match(src, /getApiWithToken\(api\("\/consents"\)\)/);
  assert.match(src, /CONSENT_LABEL\[c\.consent_type\]/);
  assert.match(src, /rm_assisted:/);
  assert.match(src, /c\.euin_number/);
});

// ── #34 / #35 identity and logos ─────────────────────────────────────────────────────────

test("no legal entity is hardcoded in the footer", () => {
  assert.doesNotMatch(code("src/components/Footer.jsx"), /Wealthcrop Advisory/i);
});

test("an index page shows no fund-house logo", () => {
  const src = code("src/pages/IndicesDetails.jsx");
  assert.doesNotMatch(src, /mutualFund\/sbi/, "every index page wore SBI Mutual Fund's logo");
  assert.doesNotMatch(src, /amcLogoUrl|<AmcMark/);
});
