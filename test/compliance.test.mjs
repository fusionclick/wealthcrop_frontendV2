// SEBI/AMFI compliance spec, the parts that are properties of the source rather than of a
// running screen. Every one of these is a rule that reads as a style preference right up
// until a regulator reads it, which is exactly why it belongs in a test and not in a memo.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const SRC = new URL("../src/", import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");

/** Source with comments stripped: a rule about what USERS see must not trip on a note to
 *  developers explaining the rule. This codebase has had that exact false positive three
 *  times. */
const readCode = (p) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(jsx?|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const ALL_FILES = walk(new URL(SRC).pathname.replace(/^\/([A-Za-z]:)/, "$1"));

// §3.B — a Mutual Fund Distributor may not present itself as an adviser. These are not
// synonyms a copywriter can swap in: each one names a SEBI registration this entity does
// not hold, and using it is a misrepresentation regardless of intent.
const FORBIDDEN = [
  "Investment Adviser",
  "Investment Advisor",
  "Financial Planner",
  "Wealth Manager",
  "Wealth Advisory",
  "Financial Planning",
  "Customized Portfolio",
  "Customised Portfolio",
  "Portfolio Management",
];

test("§3.B: no forbidden MFD terminology reaches a user", () => {
  const hits = [];
  for (const file of ALL_FILES) {
    const code = readCode(new URL(`file:///${file.replace(/\\/g, "/")}`));
    for (const term of FORBIDDEN) {
      // Case-insensitive: "financial planning" in a sentence is the same claim as the
      // title-cased version.
      const re = new RegExp(term.replace(/ /g, "\\s+"), "i");
      if (re.test(code)) hits.push(`${path.basename(file)}: "${term}"`);
    }
  }
  assert.deepEqual(hits, [], `forbidden adviser terminology in user-facing code:\n  ${hits.join("\n  ")}`);
});

test("§4.5: nothing offers cash, vouchers or coins for investing", () => {
  // Pass-backs are banned outright — not capped, not disclosed. A referral loop that pays
  // for a completed investment is the exact feature named.
  const banned = /\b(cashback|cash back|gift voucher|refer and earn|referral bonus|signup bonus|reward points)\b/i;
  const hits = [];
  for (const file of ALL_FILES) {
    const code = readCode(new URL(`file:///${file.replace(/\\/g, "/")}`));
    if (banned.test(code)) hits.push(path.basename(file));
  }
  assert.deepEqual(hits, [], `pass-back / cashback wording found in: ${hits.join(", ")}`);
});

test("§1.A: the distributor identity renders at no less than 16px, from the server", () => {
  const code = readCode("../src/components/DistributorIdentity.jsx");
  // The size is an inline style on purpose — a utility class can be purged, overridden by a
  // later class, or "tidied" to text-sm by someone balancing the footer. AMFI's floor is
  // 12pt = 16px, so this must never become a Tailwind class.
  assert.match(code, /fontSize:\s*16/, "the 16px floor is not enforced as an inline style");
  assert.doesNotMatch(code, /text-(xs|sm)[^a-z-]/, "the identity line uses a class smaller than 16px");
  // The ARN comes from the server; a bundled one goes stale and this codebase has already
  // shipped an ARN belonging to someone else.
  assert.match(code, /disclaimers/, "the identity is not fetched from the server");
  assert.doesNotMatch(code, /ARN-\d/, "an ARN is hardcoded in the bundle");
});

test("§1.A: the identity line appears on onboarding screens too, not only under the footer", () => {
  const app = readCode("../src/App.jsx");
  assert.match(app, /DistributorIdentity/, "onboarding routes drop the footer and get no identity line");
});

test("§2: no EUIN, ARN or bank fixture is left anywhere in the bundle", () => {
  // KYC.jsx used to register every investor against EUIN E234123 and ARN-873456, with a
  // stranger's VPA and a made-up account number. Dead code still ships its strings, and
  // dead payload builders get re-enabled.
  const hits = [];
  for (const file of ALL_FILES) {
    const code = readCode(new URL(`file:///${file.replace(/\\/g, "/")}`));
    if (/\bE\d{6}\b/.test(code)) hits.push(`${path.basename(file)}: hardcoded EUIN`);
    if (/ARN-\d{4,}/.test(code)) hits.push(`${path.basename(file)}: hardcoded ARN`);
    if (/tanmoy@sbi/.test(code)) hits.push(`${path.basename(file)}: another party's VPA`);
  }
  assert.deepEqual(hits, [], hits.join("\n  "));
});

test("§2 row 5: the e-NACH mandate is never registered as a side effect", () => {
  const sip = readCode("../src/pages/mutual_fund/SIPSetupPage.jsx");
  // The old shape: fire the mandate inside an empty catch the moment the SIP succeeded.
  assert.doesNotMatch(
    sip,
    /mandate[\s\S]{0,200}catch\s*\(\s*_?\s*\)\s*\{\s*\/?\*?\s*mandate optional/i,
    "the mandate is still registered silently",
  );
  assert.match(sip, /EnachAuthorization/, "there is no explicit authorisation step");
  assert.match(sip, /authorized:\s*true/, "the server's explicit-consent flag is not sent");
});

test("§3.A: the mandate screen shows the limit AND explains it", () => {
  const code = readCode("../src/components/mutual_fund/EnachAuthorization.jsx");
  assert.match(code, /Auto-Debit Authorization \(e-NACH\)/, "the required header is missing");
  assert.match(code, /Max Limit/, "the limit is not displayed");
  // "Mandate limit shock": showing ₹1,00,000 against a ₹2,000 SIP without this sentence is
  // what makes investors abandon the setup.
  assert.match(code, /step up your SIPs/i, "the explanatory card is missing");
  assert.match(code, /only<\/strong>\s*be\s*\n?\s*debited|only.{0,40}debited for your active SIP/is,
    "the 'only your SIP amount is debited' reassurance is missing");
});

test("§1.B: checkout links the commission structure and the scheme documents", () => {
  const code = readCode("../src/components/mutual_fund/OrderDisclaimers.jsx");
  assert.match(code, /trail commission structure/i, "no commission-structure link at checkout");
  assert.match(code, /SID, SAI and KIM/, "no scheme-document link at checkout");
  // A blank URL must render nothing: a dead link looks like disclosure and is not.
  // A blank URL renders nothing rather than an <a> to nowhere.
  assert.match(code, /regular_plan_commission"\s*&&\s*commissionUrl/, "an unconfigured commission URL would render a dead link");
  assert.match(code, /scheme_documents"\s*&&\s*schemeDocsUrl/, "a scheme with no document URL would render a dead link");
});
