// Engineer B — transactions & orders (Audit #11, #13, #18, #20, #22, #42, #46, #47, #49).
// Pure helpers are run directly; pages are read as source, like the rest of this suite.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { monthGrid, FALLBACK_SIP_DAYS } from "../src/utils/sipDates.js";
import { sxpIntentError } from "../src/utils/sxp.js";
import { approvalRequest } from "../src/utils/approvals.js";

const readCode = (p) =>
  fs
    .readFileSync(new URL(p, import.meta.url), "utf8")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");

// ── #13 SIP start-date calendar ───────────────────────────────────────────────────────────

test("#13: the calendar greys out past days and days the scheme does not take", () => {
  const from = new Date(2026, 9, 2, 10); // 2 Oct 2026, a Friday
  const cells = monthGrid(2026, 9, { days: [1, 5, 10, 15, 20, 25, 28], from });
  // 1 Oct 2026 is a Thursday: three blank cells in a Monday-first week.
  assert.deepEqual(cells.slice(0, 3), [null, null, null]);
  const day = (d) => cells.find((c) => c && c.day === d);
  assert.equal(day(1).allowed, false, "in the past");
  assert.equal(day(2).allowed, false, "today is not a start date — the first instalment is never dated today");
  assert.equal(day(5).allowed, true);
  assert.equal(day(7).allowed, false, "not one of the scheme's dates");
  assert.equal(day(5).iso, "2026-10-05");
  assert.equal(cells.filter(Boolean).length, 31);
});

test("#13: next month opens with every scheme date pickable", () => {
  const cells = monthGrid(2026, 10, { days: [10, 20], from: new Date(2026, 9, 2) });
  assert.deepEqual(cells.filter((c) => c?.allowed).map((c) => c.day), [10, 20]);
  assert.deepEqual(monthGrid(2026, 10, { from: new Date(2026, 9, 2) }).filter((c) => c?.allowed).map((c) => c.day), FALLBACK_SIP_DAYS);
});

test("#13: the SIP page picks its start date from that calendar, not a native date input", () => {
  const src = readCode("../src/pages/mutual_fund/SIPSetupPage.jsx");
  assert.match(src, /<SipCalendar id="sip-start-date" value=\{startDate\} onChange=\{pickStartDate\} days=\{sipDays\} \/>/);
  assert.doesNotMatch(src, /type="date"\s+value=\{startDate\}/, "the native picker is back on the start date");
  const cal = readCode("../src/components/sip/SipCalendar.jsx");
  assert.match(cal, /disabled=\{!cell\.allowed\}/, "a greyed-out day can still be clicked");
  assert.match(cal, /CalendarDays/, "the calendar icon is gone");
});

// ── #18 SWP ──────────────────────────────────────────────────────────────────────────────

const holding = { scheme_bse_code: "PP001ZG-GR", folio: "QA1000001", current_value: 33572.75 };
const sched = { installments: 12, startDayInvalid: false };

test("#18: an SWP instalment above what the holding is worth is refused before a round trip", () => {
  assert.match(sxpIntentError({ type: "swp", source: holding, amount: 40000, schedule: sched }), /more than this holding is worth today/);
  assert.equal(sxpIntentError({ type: "swp", source: holding, amount: 2000, schedule: sched }), null);
  // Unknown value never blocks: the server asks BSE.
  assert.equal(sxpIntentError({ type: "swp", source: { ...holding, current_value: null }, amount: 40000, schedule: sched }), null);
  // An STP moves money between funds; this rule is the withdrawal's.
  assert.equal(sxpIntentError({ type: "stp", source: holding, destCode: "X", amount: 40000, schedule: sched }), null);
});

test("#18: the Redeem form offers an SWP only where the scheme says it takes one", () => {
  const redeem = readCode("../src/pages/mutual_fund/RedeemMF.jsx");
  assert.match(redeem, /schemeInfo\.txn\?\.swp \?\? null/);
  assert.match(redeem, /<SxpSchedule \{\.\.\.sched\} amount=\{redeemAmount\} offered=\{swpOffered\} \/>/);
  const sxp = readCode("../src/components/mutual_fund/SxpSchedule.jsx");
  assert.match(sxp, /offered !== undefined && offered !== true/);
  assert.match(sxp, /not offered by this scheme/);
});

// ── #42 PAN gate ─────────────────────────────────────────────────────────────────────────

test("#42: redemption and SWP say a verified PAN is needed, and cannot be submitted without one", () => {
  const src = readCode("../src/pages/mutual_fund/RedeemMF.jsx");
  assert.match(src, /investorData\?\.profile\?\.pan_verified/);
  assert.match(src, /if \(!panVerified\(investorData\)\) return \{ ok: false, message: PAN_NOT_VERIFIED \}/);
  assert.equal((src.match(/if \(!panVerified\(investorData\)\)/g) || []).length, 2, "both the redeem and the SWP path check it");
  assert.match(src, /\|\| !panOk/);
});

// ── #20 SIP cancellation ─────────────────────────────────────────────────────────────────

test("#20: cancelled SIPs are asked for, kept out of the totals, and the popup says what cancelling costs", () => {
  const src = readCode("../src/components/sip/ManageSipPage.jsx");
  assert.match(src, /include_cancelled: true/);
  assert.match(src, /const running = sips\.filter\(\(s\) => s\.status !== "CANCELLED"\)/);
  assert.match(src, /running\.reduce/);
  assert.match(src, /WealthCrop charges nothing for cancelling a SIP/);
  assert.match(src, /Units already allotted stay invested/);
  assert.match(src, /Exit load applies only when you redeem/);
  assert.match(src, /fmtExitLoad\(res\?\.data\?\.scheme_info\?\.exitLoad\)/);
});

// ── #22 mandate ──────────────────────────────────────────────────────────────────────────

test("#22: the mandate screen offers the four channels, needs a UPI ID for UPI, and never claims success on its own", () => {
  const src = readCode("../src/components/mutual_fund/EnachAuthorization.jsx");
  for (const label of ["UPI AutoPay", "NetBanking", "Debit card", "Aadhaar eSign"]) assert.match(src, new RegExp(label));
  // The same VPA shape the server checks (Backend/src/mf/mandate.js).
  const backend = fs.readFileSync(new URL("../../Backend/src/mf/mandate.js", import.meta.url), "utf8");
  const vpa = /const VPA = (\/.+\/);/;
  assert.equal(src.match(vpa)?.[1], backend.match(vpa)?.[1], "browser and server disagree on what a UPI ID is");
  assert.match(src, /awaiting your approval/);
  assert.match(src, /Open the approval page/);
  assert.doesNotMatch(readCode("../src/pages/mutual_fund/SIPSetupPage.jsx"), /Auto-debit authorised\./);
});

test("#22: the SIP page sends intent only, and the card's chip reads a real status", () => {
  const sip = readCode("../src/pages/mutual_fund/SIPSetupPage.jsx");
  assert.match(sip, /authorized: true, mode, vpa, sip_reg_no:/);
  assert.doesNotMatch(sip, /buildMandatePayload/);
  const api = fs.readFileSync(new URL("../src/utils/nodeApi.js", import.meta.url), "utf8");
  assert.doesNotMatch(api, /mandate_status \|\| "Active"/, "the hard-coded 'Active' chip is back");
  assert.doesNotMatch(api, /export const buildMandatePayload/);
  const manage = readCode("../src/components/sip/ManageSipPage.jsx");
  assert.match(manage, /Mandate: \{mandateChip\(sip\)\.text\}/);
  assert.match(manage, /nodeUrl\("\/mandateStatus"\)/);
});

// ── #46 switch ───────────────────────────────────────────────────────────────────────────

test("#46: switch destinations are the source's own fund house, minus funds that take no switch", () => {
  const src = readCode("../src/pages/mutual_fund/SwitchMF.jsx");
  assert.match(src, /search: \[sourceAmc, destQuery\]\.filter\(Boolean\)\.join\(" "\)/);
  assert.match(src, /String\(f\.scheme_amc_name \|\| ""\)\.trim\(\)\.toLowerCase\(\) === sourceAmc\.toLowerCase\(\)/);
  assert.match(src, /f\.txn\?\.switchAllowed !== false/);
  assert.match(src, /srcInfo\?\.transactions\?\.switchOut\?\.allowed === false/);
});

// ── #47 spread ───────────────────────────────────────────────────────────────────────────

test("#47: the spread minimum reads the field catalogue rows actually carry", () => {
  const src = readCode("../src/pages/mutual_fund/SpreadInvest.jsx");
  assert.match(src, /min_lumpsum: Number\(fund\.minLumpsum\) \|\| 0/);
  assert.doesNotMatch(src, /minimum_purchase_amount/);
  assert.match(src, /min_amount: staggered \? 0 : p\.min_lumpsum/);
});

// ── #49 states, Place now, cancel ────────────────────────────────────────────────────────

const INVESTOR = { email: "qa@example.com", kyc: { ucc_code: "QAT6548676" } };

test("#49: Place now re-sends the approved purchase with the same details and the approval it spends", () => {
  const { path, body } = approvalRequest(
    { id: 7, kind: "purchase", intent: { scheme: "PP001ZG-GR", amount: 60000 } },
    { acknowledged: ["market_risk"], investor: INVESTOR }
  );
  assert.equal(path, "/purchaseNewOrder");
  const o = body.data.orders[0];
  assert.deepEqual([o.type, o.scheme, o.amount, o.investor.ucc], ["p", "PP001ZG-GR", 60000, "QAT6548676"]);
  assert.equal(body.data.approval_id, 7);
  assert.deepEqual(body.data.acknowledged, ["market_risk"]);
});

test("#49: an approved switch keeps its destination and folio", () => {
  const { body } = approvalRequest(
    { id: 8, kind: "switch", intent: { scheme: "PP001ZG-GR", dest_scheme: "143269", folio: "QA1000001", amount: 0, all_units: true } },
    { acknowledged: [], investor: INVESTOR }
  );
  const o = body.data.orders[0];
  assert.deepEqual([o.type, o.dest_scheme, o.folio, o.all_units, o.amount], ["sw", "143269", "QA1000001", true, 0]);
});

test("#49: an approved SIP whose start date passed starts on the next same day, same instalments", () => {
  const stale = approvalRequest(
    { id: 9, kind: "sip", intent: { scheme: "X", amount: 5000, freq: "m", start_date: "2026-09-10", end_date: "2027-09-10" } },
    { acknowledged: [], investor: INVESTOR, today: "2026-10-02" }
  );
  assert.equal(stale.path, "/xspRegister");
  assert.equal(stale.body.data.start_date, "2026-10-10");
  assert.equal(stale.body.data.txn_date, 10);
  assert.equal(stale.body.data.ninstallments, 12);
  assert.equal(stale.body.data.end_date, undefined);

  const fresh = approvalRequest(
    { id: 9, kind: "sip", intent: { scheme: "X", amount: 5000, freq: "m", start_date: "2026-11-10", end_date: "2027-11-10" } },
    { acknowledged: [], investor: INVESTOR, today: "2026-10-02" }
  );
  assert.equal(fresh.body.data.start_date, "2026-11-10");
  assert.equal(fresh.body.data.end_date, "2027-11-10");
});

test("#49: orders read in one state model, and a pending purchase can be cancelled", () => {
  const src = readCode("../src/pages/profile/order/MutualFundOrder.jsx");
  assert.match(src, /nodeUrl\("\/cancelPurchaseOrder"\), \{ data: \{ id: fund\.bse_order_id \} \}/);
  assert.match(src, /String\(fund\.order_type \|\| ""\)\.toLowerCase\(\) === "purchase" && !orderState\(fund\.status\)\.final/);
  for (const label of ["Completed", "Rejected", "Cancelled", "Pending"]) assert.match(src, new RegExp(`label: "${label}"`));
  assert.match(src, /<ApprovedOrders onPlaced=/);
  const approved = readCode("../src/pages/profile/order/ApprovedOrders.jsx");
  assert.match(approved, /r\.state === "approved" && r\.usable && r\.intent/);
  assert.match(approved, /disabled=\{!disc\.ready \|\| placing !== null\}/, "Place now must wait for the acknowledgement");
});
