import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src = fs.readFileSync("src/components/sip/ManageSipPage.jsx", "utf8");
const code = src
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^[ \t]*\/\/.*$/gm, "");

// The body of one handler, so an assertion about "cancel" cannot be satisfied by something
// three functions away.
const body = (name) => {
  const start = code.indexOf(`const ${name} = `);
  assert.ok(start >= 0, `${name} is gone from ManageSipPage`);
  const next = code.slice(start + 10).search(/\n {2}const \w+ = |\n {2}\/\*\*|\nconst \w+ = /);
  return code.slice(start, next < 0 ? undefined : start + 10 + next);
};

test("ticket 20: a failed cancel does not mark the SIP cancelled", () => {
  const fn = body("confirmCancel");
  // The bug: state was written after the try/catch, so a failed call still flipped the card
  // to "SIP cancelled. No further debits." while the debits carried on.
  const bail = fn.indexOf("if (!res)");
  const mutate = fn.indexOf("setSips(");
  assert.ok(bail >= 0, "confirmCancel no longer checks whether the call succeeded");
  assert.ok(bail < mutate, "the status is still being changed before the outcome is known");
});

test("ticket 20: a failed pause/resume does not flip the status either", () => {
  const fn = body("confirmPause");
  const bail = fn.indexOf("if (!res)");
  const mutate = fn.indexOf("setSips(");
  assert.ok(bail >= 0 && bail < mutate);
});

test("pause sends a real installment count, not an undefined one", () => {
  // `pauseData.months` never existed — the modal hands back `pauseType: \"1M\"` — so every
  // pause, whatever the investor picked, fell through to 1.
  assert.doesNotMatch(code, /pauseData\?\.months/);
  assert.match(code, /ninstallments: Number\(pauseData\?\.installments\) \|\| 1/);
  assert.match(code, /const pauseInstallments = \(months, frequency\)/);
});

test("ticket 21: modification is persisted in the backend, not 'updated locally'", () => {
  const fn = body("saveModifiedSip");
  assert.match(fn, /postApiWithToken\(nodeUrl\("\/modifyXsp"\)/, "modify still never reaches the server");
  assert.doesNotMatch(code, /updated locally/i);
  // 207 means the new SIP is live and the old one is not cancelled. Reporting that as
  // success is how somebody gets debited twice.
  assert.match(fn, /res\.status === "partial"/);
  assert.match(fn, /toastError\(res\.message\)/);
});

test("ticket 21: the SIP list is re-read after a modify, not patched locally", () => {
  // The replacement has a new reg_no, so a local patch would describe a SIP that no longer
  // exists under that id.
  assert.match(body("saveModifiedSip"), /setRefreshKey/);
  assert.match(code, /\[investorData\?\.kyc\?\.ucc_code, refreshKey\]/);
});

test("ticket 21: only the frequencies BSE accepts for a SIP are offered, as codes", () => {
  // sxp_register takes m / q / w. The select used to offer Half-yearly and Yearly and to
  // send the English word, so a frequency change could never have registered.
  assert.doesNotMatch(code, /value="Half-yearly"/);
  assert.doesNotMatch(code, /value="Yearly"/);
  assert.match(code, /FREQ_OPTIONS = \[\s*\["m", "Monthly"\],\s*\["q", "Quarterly"\],\s*\["w", "Weekly"\],?\s*\]/);
});

test("ticket 21: the modify form offers the scheme's own SIP dates", () => {
  assert.doesNotMatch(code, /\[1, 5, 10, 15, 20, 25\]/, "the hardcoded date list is back");
  assert.match(code, /allowedDays\(sipTxn, frequency\)/);
  // start_date's day must equal the SIP date (msgid 3809), so it is derived, not asked for.
  assert.match(code, /const startDate = nextOccurrence\(sipDate\)/);
});

test("ticket 19: Top-Up exists and goes to the server", () => {
  assert.match(code, /const confirmTopUp = async/);
  assert.match(body("confirmTopUp"), /postApiWithToken\(nodeUrl\("\/topupXsp"\)/);
  assert.match(code, /const TopUpSipModal = /);
  assert.match(code, />\s*Top-Up\s*<\/button>/, "no Top-Up action on the SIP card");
});

test("ticket 19: the top-up form does not invent a minimum of its own", () => {
  // Ticket 3's rule is that this app must not make up a floor BSE never published. It was
  // pinned here as "the modal never mentions a minimum at all" — and under that phrasing the
  // modal opened on a hardcoded ₹500 against a fund whose published minimum is ₹1,000. That
  // is an invented floor, and a lower one. Reading the scheme's OWN minAmount keeps the
  // rule; what must never come back is a rupee figure chosen in this file.
  const modal = code.slice(code.indexOf("const TopUpSipModal"));
  assert.doesNotMatch(modal, /Math\.max\(\s*\d{3,}/, "no hardcoded rupee floor");
  assert.doesNotMatch(modal, /minTopup\s*\|\|\s*\d{3,}/, "and no hardcoded fallback either");
  assert.match(
    modal,
    /setMinTopup\(Number\(res\?\.data\?\.scheme_info\?\.transactions\?\.sip\?\.minAmount\)/,
    "every minimum shown must have come from the scheme"
  );
});

test("the page sends intent, not a BSE payload it made up", () => {
  // reason_cd 6 and sxp_type were being named by the browser. The server owns them now, and
  // refuses a reg_no that is not this investor's.
  assert.doesNotMatch(code, /reason_cd: 6/);
  assert.doesNotMatch(body("confirmCancel"), /sxp_type/);
});

/**
 * QA: the Top-Up modal opened on ₹500 for a fund whose minimum is ₹1,000, and only said so
 * after the button was pressed. 500 was a floor invented in this file — `Math.max(500, 10%)`
 * — while the server validates against the scheme's own minAmount from BSE's master.
 * A form must not pre-fill a value it can know will be refused.
 */
test("the top-up modal asks the scheme for its minimum instead of inventing one", () => {
  assert.doesNotMatch(code, /Math\.max\(500,/, "the invented 500 floor is gone");
  // Same source the SIP and Modify forms already read.
  assert.match(code, /VITE_SCHEME_DETAILS \|\| "\/scheme-details"[\s\S]*?setMinTopup/);
  assert.match(code, /const belowMin = minTopup > 0 && Number\(amount\) < minTopup/);
});

test("the top-up minimum is shown, and blocks the button rather than only toasting", () => {
  assert.match(code, /Minimum for this fund: ₹\{minTopup/, "the number is on screen before you press");
  assert.match(code, /disabled=\{saving \|\| belowMin\}/);
});

test("a typed top-up amount is never overwritten by the scheme minimum", () => {
  // The prefill only lifts an untouched field; silently rewriting what someone typed is
  // how a form loses an instruction.
  assert.match(code, /if \(!touched && minTopup > 0 && Number\(amount\) < minTopup\) setAmount\(minTopup\)/);
});

/**
 * QA: SIP modify came back "Please read and accept the required disclaimers before placing
 * this order" — for something the screen never showed. A modify re-registers the SIP, so
 * the server runs it through the same order gate as a fresh purchase.
 */
test("the modify screen shows the disclaimers it is gated on, and sends the acks", () => {
  assert.match(src, /import OrderDisclaimers, \{ useDisclaimers \}/);
  assert.match(code, /const disc = useDisclaimers\(\)/);
  assert.match(code, /<OrderDisclaimers \{\.\.\.disc\}/, "shown on the page, not just held in state");
  assert.match(code, /acknowledged: disc\.acked/, "and actually sent with the modify");
  assert.match(code, /disabled=\{saving \|\| !disc\.ready\}/, "Save is closed until they are ticked");
});

test("the modify request carries the acknowledgement through to the server", () => {
  const fn = body("saveModifiedSip");
  assert.match(fn, /acknowledged/, "saveModifiedSip must forward it to /modifyXsp");
});
